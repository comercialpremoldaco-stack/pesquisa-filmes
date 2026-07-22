
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Configura o Express para interpretar os dados enviados pelo formulário
app.use(express.urlencoded({ extended: true }));

// 🔗 STRING DE CONEXÃO DO BANCO DE DADOS
// Substitua pelas credenciais fornecidas pelo seu provedor de banco de dados (Aiven, Neon, ElephantSQL, etc.)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_S50KpymLnQaT@ep-wandering-forest-avkb1bww-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const sequelize = new Sequelize(DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: {
        // Ativa SSL automaticamente se estiver rodando em ambiente de produção (nuvem)
        ssl: process.env.DATABASE_URL ? { require: true, rejectUnauthorized: false } : false
    },
    logging: false // Desativa logs repetitivos do SQL no terminal
});

// 📊 MAPEAMENTO DA TABELA (Model do Sequelize)
const Resposta = sequelize.define('Resposta', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING, allowNull: false },
    endereco: { type: DataTypes.TEXT, allowNull: false },
    idade: { type: DataTypes.STRING, allowNull: false },
    nacionalidade: { type: DataTypes.STRING, allowNull: false },
    sexo: { type: DataTypes.STRING, allowNull: false },
    formacao: { type: DataTypes.STRING, allowNull: false },
    streaming: { type: DataTypes.TEXT, allowNull: false },
    horario: { type: DataTypes.STRING, allowNull: false },
    assiduidade: { type: DataTypes.STRING, allowNull: false },
    classificacao: { type: DataTypes.STRING, allowNull: false },
    genero_filme: { type: DataTypes.TEXT, allowNull: false },
    tempo: { type: DataTypes.STRING, allowNull: false },
    aparelho: { type: DataTypes.TEXT, allowNull: false },
    local: { type: DataTypes.TEXT, allowNull: false },
    idioma: { type: DataTypes.STRING, allowNull: false }
}, {
    tableName: 'respostas_pesquisa', // Nome da tabela que aparecerá no DBeaver
    timestamps: true // Cria automaticamente as colunas de data de criação e atualização
});

// Sincroniza o modelo com o banco (Cria a tabela de forma automatizada)
sequelize.sync()
    .then(() => console.log('✅ Banco de dados conectado e tabela verificada/criada com sucesso.'))
    .catch(err => console.error('❌ Erro crítico ao conectar ou estruturar o banco:', err));

// Rota principal: Entrega o formulário visual para quem acessar o link
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota POST: Recebe, limpa, trata as opções "Outros" e salva as informações
app.post('/processar', async (req, res) => {
    try {
        const dados = req.body;

        // Função interna para validar se o usuário escolheu e digitou no campo "Outros"
        const tratarCampo = (campo, campoOutro) => {
            if (!campo) return 'Nenhum/Não informado';
            
            // Caso seja uma pergunta de marcar múltiplos campos (Checkbox)
            if (Array.isArray(campo)) {
                let listaFiltrada = campo.filter(valor => valor !== 'outro');
                if (campo.includes('outro') && dados[campoOutro]) {
                    listaFiltrada.push(dados[campoOutro].trim());
                }
                return listaFiltrada.join(', ');
            }
            
            // Caso seja uma pergunta de marcar apenas um campo (Radio Button)
            if (campo === 'outro') {
                return dados[campoOutro] ? dados[campoOutro].trim() : 'Outro (Não especificado)';
            }
            
            return campo;
        };

        // Monta o objeto estruturado com todos os dados tratados
        const novaResposta = {
            nome: dados.nome ? dados.nome.trim() : 'Anônimo',
            endereco: dados.endereco ? dados.endereco.trim() : 'Não informado',
            idade: dados.idade || 'Não informado',
            nacionalidade: tratarCampo(dados.nacionalidade, 'nacionalidade_outro'),
            sexo: dados.sexo || 'Não informado',
            formacao: dados.formacao || 'Não informado',
            streaming: tratarCampo(dados.streaming, 'streaming_outro'),
            horario: dados.horario || 'Não informado',
            assiduidade: dados.assiduidade || 'Não informado',
            classificacao: dados.classificacao || 'Não informado',
            genero_filme: tratarCampo(dados.genero_filme, 'genero_outro'),
            tempo: dados.tempo || 'Não informado',
            aparelho: tratarCampo(dados.aparelho, 'aparelho_outro'),
            local: tratarCampo(dados.local, 'local_outro'),
            idioma: dados.idioma || 'Não informado'
        };

        // Executa a inserção direta da linha de dados dentro do banco relacional
        await Resposta.create(novaResposta);

        // Retorna uma interface gráfica simples de sucesso para o usuário final
        res.send(`
            <div style="font-family:sans-serif; text-align:center; padding:50px; background-color:#121214; color:#fff; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center;">
                <h1 style="color:#ffb800; margin-bottom:20px;">🎬 Resposta Enviada!</h1>
                <p style="color:#adb5bd; margin-bottom:30px; font-size:1.1rem;">Agradecemos sua participação. Seus dados foram guardados com segurança.</p>
                <a href="/" style="background-color:#ffb800; color:#000; padding:12px 25px; text-decoration:none; font-weight:bold; border-radius:6px; transition: 0.2s;">Voltar ao Formulário</a>
            </div>
        `);

    } catch (error) {
        console.error('Erro operacional ao salvar no banco:', error);
        res.status(500).send('<h2 style="font-family:sans-serif; text-align:center; margin-top:50px;">Erro interno ao processar e salvar no banco de dados.</h2>');
    }
});

// Inicializa a escuta do servidor
app.listen(PORT, () => {
    console.log(`🚀 Motor rodando. Servidor ativo na porta ${PORT}`);
});
