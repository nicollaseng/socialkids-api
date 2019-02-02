const { Lancamento, Membership, Contato, User, Condominio } = require('../domain');
const lancamentoService  = require('../services/lancamento/index');
const emailService = require('../services/email/index');
const notificationService = require('../services/pushNotification/index');
const auth = require('./middlewares/auth');
const router = require('express').Router();
const fetch = require('node-fetch');
const fs = require('fs');
const moment = require('moment');
const path = require('path');
const rootPath = path.dirname(require.main.filename);
const getPDFURL = `${process.env.API_RECIBO}/getpdf`;

router.post('/getpdf', auth.required, (req, res) => {
	let headers = {
		'Authorization': req.headers.authorization,
		'Content-Type': 'application/json'
	};
	const body = JSON.stringify(req.body);
	fetch(getPDFURL, { method: 'post', body, headers }).then(data => {
		return data.json();
	}).then((json) => {
		return res.json(json);
	}).catch(err => {
		console.log('Deu error: ', err);
		return res.json({ files: [] });
	});
});

router.get('/getpdf', auth.required, (req, res) => {
	const body = JSON.stringify(req.body);
	fetch(`${getPDFURL}file`, { method: 'post', body, headers: req.headers }).then(data => {
		return data.json();
	}).then((json) => {
		let data = json.buffer.data;
		let buffer = Buffer.from(data);
		res.contentType("application/pdf");
		return res.end(buffer);
	}).catch(err => {
		console.log('Deu error: ', err);
		res.writeHead(404);
		res.end();
	});
});

router.post('/searchboleto', auth.required, (req, res) => {
	let aux = 0;
	let { code, start, end, vencimento } = req.body;
	// console.log('Vencimento is ', vencimento);
	// start = moment(vencimento > 15 ? start : end).date(vencimento + 1);
	// start = moment(vencimento > 15 ? start : end);
	// console.log('Data eh ', start);
	// end = moment(end).date(vencimento).add(vencimento > 15 ? 0 : 1, 'months');
	end = moment(end).add(-1, 'day');
	code = code ? 'xxx.xxx.xxx-xx'.replace(/x/g, _ => code[aux++]) : '518.418.758-80';
	let headers = {
		'Authorization': `Bearer ${process.env.BOLETO_SIMPLES_TOKEN}`,
		'User-Agent': `${process.env.BOLETO_SIMPLES_USER}`,
		'Content-Type': 'application/json'
	}
	// console.log(start, end);
	let searchQuery = `?q=${code}&expire_from=${start}&expire_to=${end}`;
	let url = `${process.env.BOLETO_SIMPLES_URL}bank_billets/cnpj_cpf${searchQuery}`;
	fetch(url, {
		method: 'get',
		headers
	}).then(boletoRes => {
		return boletoRes.json();
	}).then(boletos => {
		var boletosPdfs = [];
		for(let i=0; i < boletos.length; i++) {
			var boleto = boletos[i];
			var { formats, paid_at, expire_at, line, amount } = boleto;
			if(formats && formats.pdf) {
				boletosPdfs.push({ url: formats.pdf, urlPng: formats.png, pago: paid_at != null, venc: expire_at, codigo: line, valor: amount });
			}
		}
		if(boletosPdfs.length > 0)
			return res.json({ pdfs: boletosPdfs, error : null});
		else
			return res.json({ pdfs: null, error: false });
	}).catch(err => {
		console.log('Deu erro: ', err);
		return res.json({pdfs: null, error: err});
	});
});

router.post('/createboleto', auth.required, async (req, res) => {
	var result = false, contasRateios = {};
	let { start, end, unidade, blocoId, condominioId, membership, all } = req.body;

	let condominio = await Condominio.findById(condominioId);
	let {
		name, cnpj, vencimentoCota, enderecoCep, enderecoLogradouro,
		enderecoNumero, enderecoBairro, enderecoLocalidade, enderecoEstado,
		idCarteira
	} = condominio;
	if(!idCarteira || idCarteira == null)
		return res.json({error: true, msg: 'É necessário cadastrar uma ID de Carteira para esse condomínio.'});
	let billet = {
		bank_billet: {
			bank_billet_account_id: idCarteira,
			customer_zipcode: enderecoCep,
			customer_address: enderecoLogradouro,
			customer_address_number: enderecoNumero,
			customer_neighborhood: enderecoBairro,
			customer_city_name: enderecoLocalidade,
			customer_state: enderecoEstado,
			description: "Pagamento condominial."
		}
	};
	if(all) {
		var contatos = await Contato.findAll({where: { condominioId }});
		for(let i=0; i < contatos.length; i++) {
			var contato = contatos[i];
			var member = await Membership.find({
				where: {
					condominioId,
					blocoId: contato.blocoId,
					unidade: contato.unidade,
				},
				include: [ { model: User, as: 'user' }, ],
			});
			if(member && member.user && member.user.cpf) {
				contasRateios = {};
				var { user } = member;
				var contas = await Lancamento.findAll({
					where: {
						contatoId: contato.id,
						data: { gte: start, lt: end },
						boletoEmitido: false,
					}
				});
				for(let j=0; j < contas.length; j++) {
					var conta = contas[j];
					var rateioIdKey = conta.rateioUnidadeId ? conta.rateioUnidadeId : 'avulso';
					if(contasRateios.hasOwnProperty(rateioIdKey)) {
						contasRateios[rateioIdKey].push(conta);
					} else {
						contasRateios[rateioIdKey] = [conta];
					}
				}
				var rateiosIds = Object.keys(contasRateios);
				for(let j=0; j < rateiosIds.length; j++) {
					var contasRateio = contasRateios[rateiosIds[j]];
					let now = moment();
					let data = moment(contasRateio[0].data);
					if(data.isBefore(now, 'day')) {
						result = { status: 'error', msg: 'Não é possível emitir boletos para datas retroativas.' };
					} else {
						var valor = contasRateio ? contasRateio.reduce((a,b) => a + b.valor, 0) : 0;
						if(valor > 0) {
							var valorStr = valor.toString();
							var int = valorStr.slice(0, valorStr.length - 2);
							var dec = valorStr.slice(valorStr.length - 2);
							let ref = moment(contasRateio[0].data).locale('pt-br').format('MMMM/YYYY');
							valorStr = int + ',' + dec;
							billet.bank_billet.expire_at = moment(contasRateio[0].data).format('YYYY-MM-DD');
							billet.bank_billet.amount = valorStr;
							billet.bank_billet.customer_person_name = user.name;
							billet.bank_billet.customer_cnpj_cpf = user.cpf;
							result = await createBillet(billet, contasRateio, req, user, ref, name);
						}
					}
				}
				if(!result) {
					result = { status: 'error', msg: 'Boleto(s) já emitido(s).' };
				}
			}
		}
		if(!result) {
			result = { status: 'error', msg: 'Unidades sem Moradores configurados corretamente. Cadastre os Moradores das Unidades com seus respectivos CPFs para gerar seus Boletos.' };
		}
		return res.json(result);
	} else {
		let member = await Membership.findById(membership, {
			include: [ { model: User, as: 'user' }, ],
		});
		let contato = await Contato.find({ where: { unidade, blocoId, condominioId } })
		let contas = await Lancamento.findAll({
			where: {
				contatoId: contato.id,
				data: { gte: start, lt: end },
				boletoEmitido: false,
			}
		});
		let { user } = member;
		if(user && user.cpf) {
			let { phone, email, cpf } = user;
			for(let j=0; j < contas.length; j++) {
				var conta = contas[j];
				var rateioIdKey = conta.rateioUnidadeId ? conta.rateioUnidadeId : 'avulso';
				if(contasRateios.hasOwnProperty(rateioIdKey)) {
					contasRateios[rateioIdKey].push(conta);
				} else {
					contasRateios[rateioIdKey] = [conta];
				}
			}
			var rateiosIds = Object.keys(contasRateios);
			for(let j=0; j < rateiosIds.length; j++) {
				var contasRateio = contasRateios[rateiosIds[j]];
				let now = moment();
				let data = moment(contasRateio[0].data);
				if(data.isBefore(now, 'day')) {
					result = { status: 'error', msg: 'Não é possível emitir boletos para datas retroativas.' };
					return res.json(result);
				} else {
					let valor = contasRateio ? contasRateio.reduce((a,b) => a + b.valor, 0) : 0;
					if(valor > 0) {
						let valorStr = valor.toString();
						let int = valorStr.slice(0, valorStr.length - 2);
						let dec = valorStr.slice(valorStr.length - 2);
						let ref = moment(contasRateio[0].data).locale('pt-br').format('MMMM/YYYY');
						valorStr = int + ',' + dec;
						billet.bank_billet.expire_at = moment(contasRateio[0].data).format('YYYY-MM-DD');
						billet.bank_billet.amount = valorStr;
						billet.bank_billet.customer_person_name = user.name;
						billet.bank_billet.customer_cnpj_cpf = cpf;
						let result = await createBillet(billet, contasRateio, req, user, ref, name);
						return res.json(result);
					}
				}
			}
			if(!result) {
				result = { status: 'error', msg: 'Boleto já emitido.' };
				return res.json(result);
			}
		}
		if(!result) {
			result = { status: 'error', msg: 'Unidade sem usuário cadastrado' };
			return res.json(result);
		}
	}
	return res.json({error: true});
});

const createBillet = async (billet, contas, req, user, ref, nomeCondominio) => {
	let url = `${process.env.BOLETO_SIMPLES_URL}bank_billets`;
	let headers = {
		'Authorization': `Bearer ${process.env.BOLETO_SIMPLES_TOKEN}`,
		'User-Agent': `${process.env.BOLETO_SIMPLES_USER}`,
		'Content-Type': 'application/json'
	}
	return fetch(url,
		{
			method: 'post',
			headers,
			body: JSON.stringify(billet)
		}
	).then(boletoRes => {
		return boletoRes.json();
	}).then(json => {
		console.log('Boleto é: ', json);
		if(json && json.status && json.id) {
			let { id, expire_at, formats } = json;
			let context = { user: req.user, memberships: req.memberships };
			for(let i=0; i < contas.length; i++) {
				var conta = contas[i];
				if(context) {
					lancamentoService.update(context, conta.id, { boletoEmitido: true, idBoleto: id });
				}
			}
			let title = 'Boleto de Condomínio';
			let msg = 'Você recebeu o boleto de condomínio do mês ' + ref;
			let email = user.email;
			let templateEmail = 'send-boleto-to-user';
			let templateContext = {
				name: user.name,
				cond: nomeCondominio,
				data: moment(expire_at).format('DD/MM/YYYY'),
				link: formats && formats.pdf? formats.pdf : null,
			};
			emailService.sendEmail(email, title, templateEmail, templateContext);
			notificationService.sendPushNotification(context, title, msg, [user.id], 'pagamentosList');
			return { status: 'created',  json };
		}
		return { status: 'error' };
	}).catch(err => {
		console.log('Deu error!', err);
		return {error: err};
	});
}

module.exports = router;