const fs = require('fs');
const fetch = require('node-fetch');
const schedule = require('node-schedule');
const path = require('path');
const rootPath = path.dirname(require.main.filename);
const htmlpdf = require('html-pdf');
const moment = require('moment');
const emailService = require('../email');
const notificationService = require('../pushNotification');
const util = require('../util');

class ReciboService {
	getReciboID() {
		var config = fs.readFileSync("./src/services/recibo/reciboConfig.json");
		config = JSON.parse(config);
		config.id++;
		fs.writeFileSync("./src/services/recibo/reciboConfig.json", JSON.stringify(config), "utf8");
		return config.id;
	}

	incrementPdfName(base, pdfUri) {
		console.log(base, pdfUri)
		try {
			let parts = pdfUri.split('/');
			let name = parts.filter(e => e.match(/.pdf/));
			console.log(parts, name);
			if(name && name.length > 0) {
				let divided = name[0].replace('.pdf', '').split(/\(/);
				console.log(divided);
				if(divided && divided.length > 1) {
					let num = divided[1].split(/\)/)[0];
					console.log(num);
					num = parseInt(num) + 1;
					console.log(num);
					return `${base}/${divided[0]}(${num}).pdf`;
				} else {
					return `${base}/${divided[0]}(1).pdf`;
				}
			}
			return pdfUri.replace('.pdf', '') + '(+1).pdf';
		} catch(err) {
			console.log('Err Is:' , err);
			return pdfUri.replace('.pdf', '') + '(+1).pdf';
		}
	}

	createDir(base, targetDir, pdfPath, addNum = 0) {
		let newPdfPath = pdfPath, aux = 0;
		let dirs = targetDir.split(/\//);
		let fullPath = base;
		for(let i=0; i < dirs.length; i++) {
			var path = dirs[i];
			fullPath += `/${path}`;
			try {
				fs.mkdirSync(fullPath);
				// console.log(`Directory ${fullPath} created!`);
			} catch (err) {
				if (err.code !== 'EEXIST') {
					throw err;
				}
				// console.log(`Directory ${fullPath} already exists!`);
			}
		}
		while(fs.existsSync(newPdfPath)) {
			newPdfPath = pdfPath.replace('.pdf', '') + `(${++aux}).pdf`;
		}
		if(addNum > 0)
			newPdfPath = pdfPath.replace('.pdf', '') + `(${aux+addNum}).pdf`;
		return newPdfPath;
	}
	
	argsToReciboFromModels(file, user, bloco, condominio, contas, unidade, ref, sindico) {
		let total = 0, aux = 0;
		const { enderecoLogradouro: rua, enderecoNumero: num, enderecoBairro: bairro,
			enderecoLocalidade: cidade, enderecoEstado: estado, enderecoCep: cep, name, codigo
		} = condominio;

		let nomeCond = codigo + ' - ' + name;
		let maskCep = 'xxxxx-xxx'.replace(/x/g, _ => cep[aux++]);
		let endereco = rua + ', ' + num + ', ' + bairro + ', ' + cidade + ' - ' + estado + ', ' + maskCep;
		let dtEmissao = moment().format("DD/MM/YYYY HH:mm:ss");
		let logoPath = 'file://' + __dirname + '/logo.png';
		let reciboId = this.getReciboID();
		let unidadeNome = unidade + (user ? (' - ' + user.name) : '');

		let newfile = file.replace(/__ref__/g, ref)
		.replace(/__predio__/g, nomeCond)
		.replace(/__bloco__/g, bloco.name)
		.replace(/__unid__/g, unidadeNome)
		.replace(/__end__/g, endereco)
		.replace(/__sindico__/g, sindico)
		.replace(/__dataemissao__/g, dtEmissao)
		.replace(/__logo__/g, logoPath)
		.replace(/__recibo__/g, reciboId)
		
		for(let i=1; i <= 7; i++) {
			var key = '__item'+i+'__';
			var priceKey = '__price'+i+'__';
			var regname = new RegExp(key, "g");
			var regprice = new RegExp(priceKey, "g");
			if(i <= contas.length) {
				var { descricao, valor, data } = contas[i-1];
				data = moment(data).format('DD/MM/YYYY');
				descricao = data + ' - ' + descricao.split(/-/)[0].trim();
				total += valor;
				valor = util.applyCurrency(valor);
				newfile = newfile.replace(regname, descricao).replace(regprice, valor);
			} else {
				newfile = newfile.replace(regname, "").replace(regprice, "");
			}
		}

		total = util.applyCurrency(total);
		newfile = newfile.replace(/__totalprice__/g, total);

		return newfile;
	}

	getRecibosArgsForUsers(sindico, users) {
		let finalHtml = '';
		let sep = '<div style="margin-top:100px"></div>';
		const html = fs.readFileSync('./src/services/recibo/reciboargs.html', 'utf8');
		for(let i=0; i < users.length; i++) {
			var { user, bloco, cond, contas, unidade } = users[i];
			var ref = moment(contas[0].data).locale('pt-br').format('MMMM/YYYY');
			ref = ref.replace(ref[0], ref[0].toUpperCase());
			var replaced = this.argsToReciboFromModels(html, user, bloco, cond, contas, unidade, ref, sindico);
			finalHtml += replaced + sep;
		}
		return finalHtml;
	}

	sendPdfEmailAllRecibos(context, users, condominioId, addEmail) {
		let { email, name } = context.user;
		let reciboPath = `../recibos/${condominioId}/sindico`;
		let data = moment(users[0].contas[0].data).format('YYYY-MM-DD');
		let options = {
			type: 'pdf',
			format: 'A4',
			timeout: 300000,
			header: { height: '15px', contents: '<div></div>' },
		};
		let html = this.getRecibosArgsForUsers(name, users);
		let pdfPath = `${rootPath}/${reciboPath}/${data}.pdf`;
		pdfPath = this.createDir(rootPath, reciboPath, pdfPath);
		console.log("New path ", pdfPath);
		htmlpdf.create(html, options).toFile(pdfPath, function(err, res) {
			if(err == null) {
				const dataEmail = moment(users[0].contas[0].data).locale('pt-br').format('DD/MM/YYYY');
				const subject = 'Recibo de Condomínio';
				const template = 'send-allrecibos-to-sindico';
				const templateContext = { name, cond: users[0].cond.name, data: dataEmail };
				let emails = email;

				emailService.sendEmailRecibo(emails, subject, template, templateContext, pdfPath, addEmail);
			} else {
				console.log("Create PDF Error: ", err);
			}
		});
	}

	sendPdfEmailAndNotify(context, user, bloco, cond, contas, unidade, addEmail) {
		let contasRateios = {}, pdfs = [], count = 0;
		const options = { format: 'A4', type: 'pdf', timeout: 10 * 60000 };
		let reciboPath = `../recibos/${cond.id}/${bloco.id}/${unidade}`;
		var htmlDef = fs.readFileSync('./src/services/recibo/reciboargs.html', 'utf8');

		for(let i=0; i < contas.length; i++) {
			var conta = contas[i];
			if(contasRateios.hasOwnProperty(conta.rateioUnidadeId)) {
				contasRateios[conta.rateioUnidadeId].push(conta);
			} else {
				contasRateios[conta.rateioUnidadeId] = [conta];
			}
		}
		let rateiosIds = Object.keys(contasRateios);

		for(let i=0; i < rateiosIds.length; i++) {
			let reciboContas = contasRateios[rateiosIds[i]];
			let ref = moment(reciboContas[0].data).locale('pt-br').format('MMMM/YYYY');
			ref = ref.replace(ref[0], ref[0].toUpperCase());
			var html = this.argsToReciboFromModels(htmlDef, user, bloco, cond, reciboContas, unidade, ref, context.user.name);
			let data = moment(reciboContas[0].data).format('YYYY-MM-DD');
			let pdfPath = `${rootPath}/${reciboPath}/${data}.pdf`;
			pdfPath = this.createDir(rootPath, reciboPath, pdfPath, i);
			htmlpdf.create(html, options).toFile(pdfPath, function(err, res) {
				if(err == null && user) {
					const dataEmail = moment(reciboContas[0].data).locale('pt-br').format('DD/MM/YYYY');
					const mensagem = 'Você recebeu o recibo de condomínio do mês ' + ref;
					const subject = 'Recibo de Condomínio';
					const template = 'send-recibo-to-user';
					const templateContext = { name: user.name, cond: cond.name, data: dataEmail };
					let file = res && res.filename ? res.filename : pdfPath;
					let emails = user.email;
	
					//Envia Email com recibo
					emailService.sendEmailRecibo(emails, subject, template, templateContext, file, addEmail);
	
					//Notifica sobre o envio do recibo
					notificationService.sendPushNotification(null, subject, mensagem, [user.id], 'recibos');
				} else if(err) {
					console.log("Create PDF Error: ", err);
				}
			});
		}
	}

	sendPdfPrestacao(pdfInfo) {
		const options = { format: 'A4', type: 'pdf', timeout: 10 * 60000 };
		const { data, contas, condominio, user } = pdfInfo;
		const { start } = data;
		const {
			enderecoLogradouro: rua, enderecoNumero: num, enderecoBairro: bairro,
			enderecoLocalidade: cidade, enderecoEstado: estado, enderecoCep: cep, name, codigo
		} = condominio;
		let aux = 0;
		let html = fs.readFileSync('./src/services/recibo/prestacao.html', 'utf8');

		let emissao = moment().format('DD/MM/YYYY HH:mm:ss');
		let monthRef = moment(start).locale('pt-br').format('MMMM/YYYY');
		let nomeCond = codigo + ' - ' + name;
		let maskCep = 'xxxxx-xxx'.replace(/x/g, _ => cep[aux++]);
		let endereco = rua + ', ' + num + ', ' + bairro + ', ' + cidade + ' - ' + estado + ', ' + maskCep;
		let logoPath = 'file://' + __dirname + '/logo.png';

		let replacedFile = html.replace('__logo__', logoPath)
		.replace('__ref__', monthRef)
		.replace('__predio__', nomeCond)
		.replace('__end__', endereco)
		.replace('__dataemissao__', emissao);

		const bigTitleHtml = '<div class="listBigTitle"><div class="floatL textC7Item bold"><a class="itemBigTitle bold">__title__</a></div><div class="floatL vSeparator"></div></div>';
		const titleHtml = '<div class="listTitle"><div class="floatL textC7Item bold"><a class="itemTitle bold">__title__</a></div><div class="floatL vSeparator"></div></div>';
		const valueHtml = '<div class="listLine"><div class="floatL textC7Item"><a class="item">__title__</a></div><div class="floatL vSeparator"></div><div class="floatL textC3Item" style="margin-left:3px"><a class="price">__value__</a></div></div>';
		const totalValueHtml = '<div class="listLineTotal"><div class="floatL textC7Item bold"><a class="item">__title__</a></div><div class="floatL vSeparator"></div><div class="floatL textC3Item bold" style="margin-left:3px"><a class="price bold">__value__</a></div></div>';
		const titleSumHtml = '<div class="listTitle"><div class="floatL textC7Item"><a class="itemTitle bold">__title__</a></div><div class="floatL vSeparator"></div><div class="floatL textC3Item" style="margin-left:3px"><a class="price fbs bold">__value__</a></div></div>';

		contas.forEach((conta, i) => {
			let contaHtml = '';
			let hasReceitasTitle = false, hasDespesasTitle = false;
			const { id, name, identifier, despesasMes, receitasMes, saldoInicio, saldoFim, categorias } = conta;
			contaHtml += bigTitleHtml.replace('__title__', name);
			contaHtml += titleSumHtml
				.replace('__title__', 'SALDO INICIAL')
				.replace('__value__', util.applyCurrency(saldoInicio));

			let categoriasReceitas = categorias.filter((categoria) => categoria.tipo === 'receita');
			let categoriasDespesas = categorias.filter((categoria) => categoria.tipo === 'despesa');
			for(let i in categoriasDespesas) {
				let categoria = categoriasDespesas[i];
				let { subcategorias } = categoria;
				for(let j in subcategorias) {
					let subcategoria = subcategorias[j];
					let { lancamentos } = subcategoria;
					if(lancamentos && lancamentos.length > 0) {
						if(!hasDespesasTitle) {
							contaHtml += titleHtml.replace('__title__', 'Despesas');
							hasDespesasTitle = true;
						}
						for(let l in lancamentos) {
							let lancamento = lancamentos[l];
							let { data, descricao, valor } = lancamento;
							let cleanDesc = (descricao || '').split('-')[0].trim();
							let title = `${moment(data).format('DD/MM/YYYY')} - ${cleanDesc}`;
							let value = util.applyCurrency(valor);
							contaHtml += valueHtml
								.replace('__title__', title)
								.replace('__value__', value);
						}
					}
				}
			}
			if(hasDespesasTitle && despesasMes > 0)
				contaHtml += totalValueHtml
					.replace('__title__', 'TOTAL DE DESPESAS')
					.replace('__value__', util.applyCurrency(despesasMes));
			for(let i in categoriasReceitas) {
				let categoria = categoriasReceitas[i];
				let { subcategorias } = categoria;
				for(let j in subcategorias) {
					let subcategoria = subcategorias[j];
					let { lancamentos } = subcategoria;
					if(lancamentos && lancamentos.length > 0) {
						if(!hasReceitasTitle) {
							contaHtml += titleHtml.replace('__title__', 'Receitas');
							hasReceitasTitle = true;
						}
						for(let l in lancamentos) {
							let lancamento = lancamentos[l];
							let { data, descricao, valor } = lancamento;
							let title = `${moment(data).format('DD/MM/YYYY')} - ${descricao}`;
							let value = util.applyCurrency(valor);
							contaHtml += valueHtml
								.replace('__title__', title)
								.replace('__value__', value);
						}
					}
				}
			}
			if(hasReceitasTitle && receitasMes > 0)
				contaHtml += totalValueHtml
					.replace('__title__', 'TOTAL DE RECEITAS')
					.replace('__value__', util.applyCurrency(receitasMes));

			contaHtml += titleSumHtml
				.replace('__title__', 'SALDO FINAL')
				.replace('__value__', util.applyCurrency(saldoFim));

			replacedFile = replacedFile.replace(`__${identifier}__`, contaHtml);
		});

		let pdfuri = `${__dirname}/prestacao.pdf`;
		htmlpdf.create(replacedFile, options).toFile(pdfuri, function(err, res) {
			if(err == null) {
				const subject = 'Prestação de Contas Condominial';
				const template = 'send-prestacao';
				const dataEmail = moment(start).locale('pt-br').format('MM/YYYY');
				const templateContext = { name: user.name, cond: condominio.name, data: dataEmail };
				let file = res && res.filename ? res.filename : pdfPath;
				let emails = user.email;

				// Envia Email com Prestação de Contas
				emailService.sendEmailRecibo(emails, subject, template, templateContext, file);
			} else if(err) {
				console.log("Create PDF Error: ", err);
			}
		});
	}

	async updateAllBoletos() {
		var rule = new schedule.RecurrenceRule();
		// rule.hour = 1;
		rule.minute = 1;
		rule.second = 0;
		var updateJob = schedule.scheduleJob(rule, async function() {
			console.log('Atualizando Boletos... ', process.env.BOLETO_SIMPLES_URL);
			const { Lancamento, Condominio } = require('../../domain');
			const lancamentoService = require('../lancamento/index');
			let baseUrl = `${process.env.BOLETO_SIMPLES_URL}bank_billets`;
			let headers = {
				'Authorization': `Bearer ${process.env.BOLETO_SIMPLES_TOKEN}`,
				'User-Agent': `${process.env.BOLETO_SIMPLES_USER}`,
				'Content-Type': 'application/json'
			}
			let start = moment().startOf('year').format('YYYY-MM-DD');
			let end = moment().endOf('year').format('YYYY-MM-DD');
			let condominios = await Condominio.findAll();
			condominios = condominios.filter(e => e.idCarteira != null);
			for(let i=0; i < condominios.length; i++) {
				let condominio = condominios[i];
				let { idCarteira } = condominio;
				let url = `${baseUrl}?bank_billet_account_id=${idCarteira}&status=paid&expire_at[]=${start}&expire_at[]=${end}`;
				fetch(url, {
					method: 'get',
					headers
				}).then(boletoRes => {
					return boletoRes.json();
				}).then(async boletos => {
					for(let j=0; j < boletos.length; j++) {
						let { id, paid_at } = boletos[j];
						if(id && paid_at != null) {
							let contas = await Lancamento.findAll({ where: { idBoleto: id, pago: false } });
							for(let k=0; k < contas.length; k++) {
								let conta = contas[k];
								lancamentoService.update({ shouldPass: true }, conta.id, { pago: true });
							}
						}
					}
				}).catch(err => {
					console.log('Error Creation Boleto: ', err);
				});
			}
		});
	}
}

module.exports = new ReciboService()