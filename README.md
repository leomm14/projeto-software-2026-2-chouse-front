# Chouse Front-end (Consenso) - React + Vite + Auth0

Front-end do projeto **Consenso (Chouse)**, estruturado com base no projeto de referência da disciplina e integrado com o **Auth0** e os 3 microsserviços do back-end:
- **User Service (`chouse-user`)**: porta `8082` (`/usuarios`)
- **Poll Service (`chouse-pool`)**: porta `8081` (`/enquetes`)
- **Game Service (`chouse-game`)**: porta `8080` (`/palpites`)

## Como executar localmente

1. Instale as dependências:
```bash
npm install
```

2. Execute em modo de desenvolvimento:
```bash
npm run dev
```

O arquivo `vite.config.js` já possui proxy reverso configurado para redirecionar `/api/usuarios`, `/api/enquetes` e `/api/palpites` para as portas `8082`, `8081` e `8080` localmente sem erros de CORS. Para deploy na Vercel, basta ajustar o IP da máquina da AWS no arquivo `vercel.json`.
