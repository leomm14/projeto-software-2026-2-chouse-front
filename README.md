# Chouse — Sua opinião vale jogo.

Frontend em React 19 e Vite para a plataforma de enquetes descrita na proposta do projeto. A experiência tem dois modos: **votação**, para registrar a preferência pessoal sem revelar percentuais; e **adivinhação**, para tentar acertar a escolha da maioria e ganhar pontos sem alterar os votos.

## Executar

```bash
npm install
npm run dev
```

Acesse a URL exibida pelo Vite, normalmente `http://localhost:5173`. No PowerShell com execução de scripts desabilitada, use `npm.cmd` no lugar de `npm`.

## Experiência

- Descoberta de confrontos, busca por pergunta/opções, categorias e ordenação.
- Confirmação de votos e palpites, prevenção de envio repetido durante a requisição e tratamento de conflitos do servidor.
- Resultados revelados após o palpite, com possibilidade de consultá-los novamente no modo adivinhação.
- Jornada com pontuação, quantidade de palpites, acertos e histórico. Os níveis são uma apresentação da pontuação acumulada: um nível a cada 100 pontos.
- Perfil editável, login/cadastro e logout com Auth0.
- Criação e encerramento de enquetes para contas com a role `ADMIN` no claim `https://social-insper.com/roles`. A autorização efetiva continua sendo responsabilidade dos serviços.
- Layout para desktop e celular, navegação por teclado, diálogos nativos com foco contido, feedback de carregamento e mensagens de erro.

Visitantes veem uma prévia identificada com enquetes de exemplo. **Experimentar demo** ativa um ambiente separado: votos, palpites e pontos ilustrativos ficam apenas no `sessionStorage` da aba, sem requisições de escrita aos serviços. Acertos na demo valem 10 pontos; na conta real, a pontuação vem do Game Service. Encerrar a demo retorna à experiência normal.

## Configuração

As configurações atuais do Auth0 foram preservadas como valores padrão. Para outros ambientes, copie `.env.example` para `.env.local` e preencha:

```dotenv
VITE_AUTH0_DOMAIN=seu-tenant.us.auth0.com
VITE_AUTH0_CLIENT_ID=seu-client-id
VITE_AUTH0_AUDIENCE=identificador-da-sua-api
VITE_API_URL=/api
```

O domínio, o identificador público do cliente e a audience não são segredos. Não coloque client secrets em variáveis `VITE_*`, pois elas são incorporadas ao frontend. Configure no Auth0 as URLs de callback, logout e web origins do ambiente utilizado. O retorno do login usa `window.location.origin`.

O frontend obtém o access token pelo SDK e o envia como Bearer nas chamadas reais. Os tokens não são exibidos na interface. O perfil é consultado pelo identificador Auth0 e criado quando o User Service responde 404.

## Serviços

O proxy local do Vite preserva as integrações existentes:

| Prefixo | Serviço | Porta local |
| --- | --- | --- |
| `/api/usuarios` | User Service | 8082 |
| `/api/enquetes` | Poll Service | 8081 |
| `/api/palpites` | Game Service | 8080 |

Para a experiência autenticada, os três serviços precisam estar disponíveis. Falhas de conexão mostram uma mensagem com opções de reconectar ou experimentar a demonstração. Na Vercel, os destinos permanecem em `vercel.json`; ajuste-os ao ambiente de publicação.

## Organização

| Arquivo | Responsabilidade |
| --- | --- |
| `src/App.jsx` | Navegação, estrutura e descoberta de enquetes |
| `src/usePlayground.js` | Sessão, sincronização, votos, palpites e mutações |
| `src/api.js` | Cliente HTTP e tratamento de erros |
| `src/PollCard.jsx` | Confrontos entre opções |
| `src/Hero.jsx` | Apresentação dos modos e ilustração em CSS |
| `src/Journey.jsx` | Perfil, pontuação e histórico |
| `src/PlaygroundModal.jsx` | Confirmações, resultados, regras e formulários |
| `src/Modal.jsx` | Diálogo acessível com restauração de foco |
| `src/data.js` | Categorias e dados exclusivos da demonstração |

O estilo usa CSS local, sem Tailwind via CDN. As fontes DM Sans e Space Grotesk usam Google Fonts, com fallback para sans-serif.

## Validação

```bash
npm run build
npm run lint
npm run check:browser
```

O teste de navegador requer o Vite em execução e uma instalação local do Chrome. Ele usa o protocolo de depuração do Chromium e os módulos nativos do Node 22, sem dependências extras. Para outro navegador Chromium ou endereço do frontend, configure `CHOUSE_BROWSER` e `CHOUSE_URL`.

O roteiro verifica acesso de visitante, demonstração, sigilo dos resultados no voto, independência dos palpites, pontuação, prevenção de repetição, consulta de resultados anteriores, busca, categorias, histórico, persistência da sessão, navegação mobile e ausência de overflow horizontal entre 360 e 1440 pixels. Capturas são salvas em `.artifacts/`, ignorado pelo Git. Ele não faz login com uma conta real nem valida os serviços remotos.
