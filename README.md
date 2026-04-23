# Projeto Barbearia

Sistema de agendamento para barbearia desenvolvido em React.

## Como executar

1. Instalar dependências: `npm install`
2. Executar projeto: `npm run dev`
3. Abrir em: `http://localhost:5173`

## Funcionalidades

- Agendamento de horários
- Programa de fidelidade
- Painel administrativo do barbeiro
- Gerenciamento de slots por dia
- Sistema completo de agendamento para barbearia desenvolvido em React.

## 🚀 Funcionalidades

- **Agendamento de horários** - Clientes podem marcar cortes
- **Programa de fidelidade** - A cada 5 cortes, 1 gratuito
- **Painel do barbeiro** - Gerenciamento completo (senha: 1234)
- **Horários personalizáveis** - Configure slots por dia da semana
- **Histórico de clientes** - Acompanhe todos os atendimentos

## 🛠️ Tecnologias

- **React 18** - Framework JavaScript
- **Vite** - Build tool e dev server
- **LocalStorage** - Persistência de dados

## 📦 Como executar localmente

1. **Clone o repositório**
   ```bash
   git clone https://github.com/JosivaldoS/ProjetoBarbearia.git
   cd ProjetoBarbearia
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Execute o projeto**
   ```bash
   npm run dev
   ```

4. **Abra no navegador**
   ```
   http://localhost:5173
   ```

## 🎨 Estrutura do projeto

```
src/
├── App.jsx                 # Componente principal
├── main.jsx               # Ponto de entrada
├── styles.js              # Estilos globais
├── components/
│   ├── HomeScreen.jsx     # Tela inicial
│   ├── ClientFlow.jsx     # Fluxo do cliente
│   ├── BarberPanel.jsx    # Painel do barbeiro
│   ├── AgendaTab.jsx      # Aba de agenda
│   ├── SlotsTab.jsx       # Configuração de horários
│   ├── LoyaltyTab.jsx     # Programa fidelidade
│   ├── ClientsTab.jsx     # Gestão de clientes
│   └── common/
│       └── Row.jsx        # Componente auxiliar
├── utils/
│   └── data.js            # Dados e funções utilitárias
```

## 📱 Como usar

### Para clientes:
1. Digite seu telefone
2. Escolha o serviço
3. Selecione dia e horário
4. Confirme o agendamento

### Para barbeiros:
1. Clique em "Painel do Barbeiro"
2. Senha: `1234`
3. Gerencie agenda, horários e clientes

## 🌟 Destaques

- **Interface moderna** com design elegante
- **Responsivo** - funciona em desktop e mobile
- **Programa fidelidade** automático
- **Persistência local** - dados salvos no navegador
- **Código organizado** em componentes modulares

