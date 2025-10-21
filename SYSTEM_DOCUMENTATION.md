```markdown
# Documentação do Sistema de Avaliação de Desempenho

## Visão Geral

Este documento detalha as funcionalidades de cada página e componente do sistema de avaliação de desempenho. O objetivo é fornecer uma base para a recriação do sistema em um ambiente offline utilizando Django.

**Tecnologias Atuais (Frontend):**
*   React 18.2.0
*   Vite
*   TailwindCSS 3.3.2
*   shadcn/ui
*   Lucide React (Ícones)
*   Framer Motion (Animações)
*   React Router 6.16.0 (Navegação)
*   LocalStorage (Persistência de dados atual)

**Tipos de Usuário e Permissões Base:**
*   **Administrador (admin):** Acesso total ao sistema. Pode gerenciar usuários, funções, competências, criar e visualizar todas as avaliações e relatórios.
*   **Gerente (manager):** Pode gerenciar seus subordinados diretos, iniciar avaliações para eles, responder a avaliações pendentes, visualizar relatórios de sua equipe e próprios.
*   **Funcionário (employee):** Pode visualizar suas próprias avaliações, responder a avaliações pendentes (incluindo autoavaliações se aplicável) e visualizar um resumo de seu desempenho nos relatórios.

---

## Estrutura de Dados Principal (LocalStorage)

*   **`users`**: Array de objetos, cada um representando um usuário.
    *   `id`: String (único)
    *   `name`: String
    *   `email`: String (usado para login)
    *   `password`: String (para login)
    *   `role`: String (ID da função, ex: 'admin', 'manager', 'employee')
    *   `department`: String
    *   `position`: String
    *   `managerId`: String (ID do gestor direto, `null` para usuários sem gestor direto)
    *   `avatar`: String (URL da imagem do avatar)
*   **`evaluations`**: Array de objetos, cada um representando uma avaliação.
    *   `id`: String (único)
    *   `evaluatorId`: String (ID do usuário que realiza a avaliação)
    *   `evaluatedId`: String (ID do usuário que está sendo avaliado)
    *   `type`: String ('180' para líder-colaborador, '360' para incluir pares/autoavaliação)
    *   `scores`: Objeto (pares de `competencyId: score`, ex: `{ '1': 4, '2': 5 }`)
    *   `comments`: String (Comentários gerais do avaliador)
    *   `initialComments`: String (Comentários/instruções do criador da avaliação)
    *   `customFields`: Array de objetos (`{ name: String, value: String }`)
    *   `status`: String ('pending', 'active', 'completed')
    *   `createdAt`: String (ISO date string da criação)
    *   `completedAt`: String (ISO date string da conclusão, opcional)
    *   `period`: String (ex: "Q1 2025")
    *   `selfFeedback`: String (Feedback da autoavaliação, se aplicável)
*   **`competencies`**: Array de objetos, cada um representando uma competência.
    *   `id`: String (único)
    *   `name`: String
    *   `description`: String
*   **`roles`**: Array de objetos, cada um representando uma função/perfil.
    *   `id`: String (único, ex: 'admin', 'manager', 'employee')
    *   `name`: String (ex: 'Administrador', 'Gerente')
    *   `description`: String

---

## Páginas e Funcionalidades

### 1. Login (`src/pages/Login.jsx`)

*   **Objetivo:** Autenticar usuários no sistema.
*   **Funcionalidades:**
    *   Formulário com campos para "Email" e "Senha".
    *   Validação de credenciais contra os dados armazenados em `localStorage` (`users`).
    *   Exibição de mensagens de erro para login inválido.
    *   Redirecionamento para o Dashboard em caso de sucesso.
    *   Exibição de usuários de teste para facilitar o acesso.
*   **Fluxo de Dados:**
    *   **Leitura:** `users` do `localStorage` para verificar credenciais.
    *   **Escrita:** `currentUser` no `localStorage` após login bem-sucedido.
*   **Componentes UI:** Card, Input, Label, Button, Toast.

### 2. Layout (`src/components/Layout.jsx`)

*   **Objetivo:** Estrutura principal da aplicação após o login, contendo a barra lateral de navegação e o cabeçalho.
*   **Funcionalidades:**
    *   **Barra Lateral (Sidebar):**
        *   Exibe o logo "Avaliação Pro".
        *   Mostra informações do usuário logado (avatar, nome, cargo, função).
        *   Menu de navegação dinâmico baseado na função do usuário:
            *   **Todos os Usuários:** Dashboard, Avaliações, Relatórios, Organograma, Perfil.
            *   **Admin Adiciona:** Gerenciar Usuários, Configurações.
            *   **Gerente Adiciona:** Gerenciar Usuários (para seus subordinados).
        *   Botão "Sair" (logout).
        *   Responsiva: pode ser oculta/exibida em telas menores.
    *   **Cabeçalho (Header):**
        *   Botão para exibir/ocultar a sidebar em telas menores.
        *   Mensagem de boas-vindas ao usuário.
    *   **Conteúdo Principal:** Área onde o conteúdo da página selecionada é renderizado.
*   **Fluxo de Dados:**
    *   **Leitura:** Dados do `currentUser` do `AuthContext` e `roles` do `DataContext` para determinar itens de menu e informações do usuário.
*   **Componentes UI:** Button.

### 3. Dashboard (`src/pages/Dashboard.jsx`)

*   **Objetivo:** Apresentar uma visão geral e estatísticas chave do sistema.
*   **Funcionalidades:**
    *   Título e saudação.
    *   **Cards de Estatísticas (para Admin/Gerente):**
        *   Total de Usuários
        *   Avaliações Ativas
        *   Avaliações Concluídas
        *   Taxa de Conclusão (%)
    *   **Seção "Avaliações Recentes":**
        *   Lista das últimas 5 avaliações (qualquer status).
        *   Exibe avatar e nome do avaliado, nome do avaliador, tipo e status da avaliação.
    *   **Seção "Minha Situação":**
        *   **Para Funcionários:**
            *   Card "Próxima Avaliação" (informação estática/placeholder).
            *   Card "Última Avaliação" (informação estática/placeholder).
        *   **Para Admin/Gerentes:**
            *   Card "Avaliações Pendentes" (informação estática/placeholder).
            *   Card "Relatórios" (informação estática/placeholder).
*   **Fluxo de Dados:**
    *   **Leitura:** `users` e `evaluations` do `DataContext`.
*   **Componentes UI:** Card, motion (Framer Motion).
*   **Permissões:**
    *   Todos os usuários logados podem ver o Dashboard.
    *   Conteúdo dos cards de "Minha Situação" e estatísticas gerais pode variar ou ser mais relevante para Admin/Gerentes.

### 4. Gerenciar Usuários (`src/pages/Users.jsx`)

*   **Objetivo:** Permitir que Administradores e Gerentes gerenciem usuários.
*   **Funcionalidades:**
    *   **Listagem de Usuários:**
        *   Exibição em formato de cards.
        *   Cada card mostra: avatar, nome, cargo, email, função, departamento, gestor.
        *   Barra de pesquisa para filtrar usuários por nome, email ou departamento.
    *   **Criar Novo Usuário (Admin):**
        *   Botão "Novo Usuário" abre um modal.
        *   Formulário no modal: Nome, Email, Senha, Função (Select), Departamento, Cargo, Gestor (Select).
        *   Validação básica de campos.
    *   **Editar Usuário (Admin, ou Gerente para seus subordinados):**
        *   Botão "Editar" em cada card de usuário abre o mesmo modal preenchido com os dados do usuário.
        *   Senha pode ser deixada em branco para não alterar.
    *   **Remover Usuário (Admin):**
        *   Botão "Remover" em cada card de usuário (exceto o próprio usuário logado).
        *   Confirmação antes da exclusão.
*   **Fluxo de Dados:**
    *   **Leitura:** `users` e `roles` do `DataContext`.
    *   **Escrita:** Salva (cria/atualiza/remove) usuários no `localStorage` através de `saveUsers` do `DataContext`.
*   **Componentes UI:** Card, Input, Label, Button, Dialog, Select, Toast.
*   **Permissões:**
    *   **Admin:** Acesso total (criar, editar todos, remover todos exceto ele mesmo).
    *   **Gerente:** Pode visualizar todos os usuários (conforme `filteredUsers`), mas só pode editar seus subordinados diretos. Não pode criar ou remover usuários.
    *   **Funcionário:** Não tem acesso a esta página.

### 5. Avaliações (`src/pages/Evaluations.jsx`)

*   **Objetivo:** Gerenciar o ciclo de vida das avaliações.
*   **Funcionalidades:**
    *   Título e descrição da página.
    *   **Botão "Nova Avaliação" (Admin/Gerente):**
        *   Abre o modal `EvaluationFormModal`.
        *   Permite selecionar: Tipo de Avaliação (180°/360°), Colaborador a ser Avaliado (filtrado por permissão: admin vê todos, gerente vê seus subordinados), Comentários Iniciais, Campos Personalizados (adicionar campos de texto simples).
        *   Ao submeter, cria uma avaliação com status 'pending' e atribui o usuário logado como `evaluatorId`.
    *   **Abas de Listagem:**
        *   **"Minhas Avaliações":**
            *   Lista avaliações onde o usuário logado é o `evaluatedId` OU o `evaluatorId` e o status NÃO é 'pending' (ou seja, que ele já respondeu ou que foram respondidas para ele).
            *   Renderiza `EvaluationList`.
        *   **"Pendentes para Avaliar" (Admin/Gerente):**
            *   Lista avaliações onde o usuário logado é o `evaluatorId` e o status é 'pending'.
            *   Mostra um contador de avaliações pendentes na aba.
            *   Renderiza `EvaluationList` com `isPendingList={true}`.
            *   Permite abrir o modal `EvaluationResponseModal` para responder.
        *   **"Avaliações da Equipe" (Gerente):**
            *   Lista avaliações CONCLUÍDAS dos subordinados diretos do gerente.
            *   Renderiza `EvaluationList`.
    *   **`EvaluationList` (Componente Reutilizável):**
        *   Exibe avaliações em cards.
        *   Cada card mostra: Tipo, Período, Status (com ícone), Avaliado, Avaliador, Nota Média (se concluída).
        *   Botão "Ver Detalhes": Abre `EvaluationDetailsModal` (para todos os tipos de lista).
        *   Botão "Responder Avaliação" (apenas para `isPendingList={true}` e se o `evaluatorId` for o usuário logado): Abre `EvaluationResponseModal`.
    *   **`EvaluationDetailsModal` (Componente):**
        *   Mostra todos os detalhes de uma avaliação: Tipo, Período, Status, Data de Conclusão, Pontuações por Competência (com estrelas), Campos Personalizados preenchidos, Comentários Gerais do Avaliador.
        *   Se a avaliação não estiver 'completed', informa que os detalhes completos só estarão disponíveis após a conclusão.
    *   **`EvaluationResponseModal` (Componente):**
        *   Usado por avaliadores para preencher uma avaliação pendente.
        *   Título e descrição adaptados.
        *   Lista de competências (do `DataContext`) para pontuar (1-5 estrelas).
        *   Campo para Comentários Gerais.
        *   Campos personalizados (se houver na avaliação) para preenchimento.
        *   Ao submeter, atualiza a avaliação para 'completed', preenche `scores`, `comments`, `customFields.value`, `completedAt`.
*   **Fluxo de Dados:**
    *   **Leitura:** `users`, `evaluations`, `competencies`, `roles` do `DataContext`. `currentUser` do `AuthContext`.
    *   **Escrita:** Salva (cria/atualiza) avaliações no `localStorage` através de `saveEvaluations` do `DataContext`.
*   **Componentes UI:** Button, Tabs, Card, Dialog, Select, Input, Label, Textarea, Star (ícone), Toast.
*   **Permissões:**
    *   **Todos:** Podem ver "Minhas Avaliações".
    *   **Admin/Gerente:** Podem criar avaliações e ver "Pendentes para Avaliar".
    *   **Gerente:** Vê adicionalmente "Avaliações da Equipe".
    *   Apenas o `evaluatorId` designado pode responder a uma avaliação 'pending'.

### 6. Relatórios (`src/pages/Reports.jsx`)

*   **Objetivo:** Apresentar dados consolidados e gráficos sobre o desempenho.
*   **Funcionalidades:**
    *   Título e descrição.
    *   **Botão "Exportar PDF" (Admin/Gerente):**
        *   Utiliza `html2canvas` e `jspdf` (atualmente exporta HTML e sugere "Salvar como PDF" no navegador).
        *   Gera um relatório com base nos filtros atuais.
    *   **`ReportFilters` (Componente - Admin/Gerente):**
        *   Filtros: Período (Todos, Trimestre Atual, Ano Atual), Departamento (Todos, Lista de Deptos), Colaborador Avaliado (Todos, Lista de Usuários filtrada por permissão).
        *   Os filtros afetam os dados exibidos nos cards de resumo e gráficos.
    *   **`ReportSummaryCards` (Componente):**
        *   Cards de resumo: Total Avaliações Concluídas, Taxa de Conclusão (sempre 100% pois filtra por 'completed'), Média Geral de Performance, Nº Avaliações Concluídas.
    *   **`ReportCharts` (Componente):**
        *   Abas para diferentes gráficos de pizza (`CustomPieChart`):
            *   **Performance (Todos os perfis):** Distribuição por faixas de desempenho (Excelente, Bom, etc.). Para Funcionários, mostra apenas a sua.
            *   **Competências (Todos os perfis):** Média por competência. Para Funcionários, mostra apenas as suas.
            *   **Departamentos (Admin/Gerente):** Média de desempenho por departamento.
            *   **Tipos de Avaliação (Admin/Gerente):** Distribuição entre 180° e 360°.
        *   Exibe mensagem se não houver dados para o gráfico com os filtros atuais.
*   **Fluxo de Dados:**
    *   **Leitura:** `users`, `evaluations`, `competencies`, `roles` do `DataContext`. `currentUser` do `AuthContext`.
    *   Os dados são processados e agregados localmente para gerar os resumos e dados dos gráficos.
*   **Componentes UI:** Button, Card, Select, Label, Tabs, `CustomPieChart`, Toast.
*   **Permissões:**
    *   **Admin/Gerente:** Acesso completo aos filtros, cards de resumo e todos os tipos de gráficos. Podem exportar PDF.
    *   **Funcionário:** Não vê filtros. Vê cards de resumo e gráficos de "Performance" e "Competências" referentes apenas aos seus próprios dados. Não pode exportar PDF.

### 7. Organograma (`src/pages/Organogram.jsx`)

*   **Objetivo:** Visualizar a estrutura hierárquica da empresa.
*   **Funcionalidades:**
    *   Título e descrição.
    *   **Cards de Resumo:** Total de Colaboradores, Departamentos, Gestores.
    *   **Visão por Departamento:** Cards listando cada departamento com total de colaboradores, gestores e funcionários.
    *   **Estrutura Hierárquica:**
        *   Renderização recursiva dos usuários e seus subordinados (`UserNode`).
        *   Nós expansíveis/recolhíveis (ícones Chevron).
        *   Cada nó de usuário exibe: avatar, nome, cargo, departamento, função (com cor específica) e número de subordinados diretos.
*   **Fluxo de Dados:**
    *   **Leitura:** `users` e `roles` do `DataContext` para construir a hierarquia e exibir detalhes.
*   **Componentes UI:** Card, motion (Framer Motion).
*   **Permissões:** Todos os usuários logados podem visualizar o organograma.

### 8. Perfil (`src/pages/Profile.jsx`)

*   **Objetivo:** Permitir que o usuário visualize e edite suas próprias informações e acompanhe seu desempenho.
*   **Funcionalidades:**
    *   Título e botão "Editar"/"Salvar".
    *   **Card "Informações Pessoais":**
        *   Avatar, Nome, Email, Cargo, Departamento.
        *   Campos podem ser editados quando o modo de edição está ativo.
    *   **Abas de Desempenho:**
        *   **"Visão Geral":**
            *   Cards: Pontuação Média, Avaliações Recebidas, Avaliações Completas.
        *   **"Minhas Avaliações":**
            *   Lista de avaliações onde o usuário foi o `evaluatedId`.
            *   Mostra: Período, Avaliador, Tipo, Status, Pontuação Média (se completa).
        *   **"Competências":**
            *   Lista de competências avaliadas para o usuário.
            *   Mostra nome da competência, média da pontuação e uma barra de progresso visual.
*   **Fluxo de Dados:**
    *   **Leitura:** `currentUser` do `AuthContext`. `users`, `evaluations`, `competencies` do `DataContext`.
    *   **Escrita:** Salva as atualizações do perfil do usuário no `localStorage` através de `saveUsers` do `DataContext`.
*   **Componentes UI:** Button, Input, Label, Card, Tabs, Toast.
*   **Permissões:** Todos os usuários logados podem acessar e editar seu próprio perfil.

### 9. Configurações (`src/pages/Settings.jsx`)

*   **Objetivo:** Permitir que Administradores gerenciem Funções e Competências do sistema.
*   **Funcionalidades:**
    *   Título e descrição.
    *   **Abas:**
        *   **"Funções":**
            *   Listagem de funções existentes (ID, Nome, Descrição).
            *   Botões "Editar" e "Remover" para cada função.
            *   Botão "Nova Função": Abre modal para criar uma nova função (ID, Nome, Descrição). IDs como 'admin', 'manager', 'employee' são cruciais para a lógica de permissões.
        *   **"Competências":**
            *   Listagem de competências existentes (Nome, Descrição).
            *   Botões "Editar" e "Remover" para cada competência.
            *   Botão "Nova Competência": Abre modal para criar uma nova competência (Nome, Descrição).
*   **Fluxo de Dados:**
    *   **Leitura:** `roles` e `competencies` do `DataContext`.
    *   **Escrita:** Salva (cria/atualiza/remove) funções e competências no `localStorage` através de `saveRoles` e `saveCompetencies` do `DataContext`.
*   **Componentes UI:** Button, Input, Label, Card, Dialog, Tabs, Toast.
*   **Permissões:** Apenas Administradores (`admin`) têm acesso a esta página.

---

## Componentes Reutilizáveis Chave

*   **`ProtectedRoute.jsx`**: Garante que apenas usuários autenticados (e com as funções corretas, se especificado por `requiredRoles`) possam acessar determinadas rotas. Redireciona para `/login` caso contrário.
*   **`CustomPieChart.jsx`**: Componente de gráfico de pizza usando Recharts, customizado para o estilo da aplicação.
*   **`EvaluationList.jsx`**: Lista avaliações em cards, com lógica para exibir detalhes ou permitir respostas.
*   **Modais (`EvaluationFormModal.jsx`, `EvaluationDetailsModal.jsx`, `EvaluationResponseModal.jsx`, modais em `Users.jsx` e `Settings.jsx`):** Usam o componente `Dialog` do shadcn/ui para interações de formulário e exibição de detalhes.
*   **Componentes UI (shadcn/ui - `src/components/ui/`):** Button, Card, Dialog, Input, Label, Select, Tabs, Textarea, Toast, Toaster. Estes são blocos de construção básicos para a interface.

---

## Utilitários

*   **`src/utils/pdfExport.js`**:
    *   `exportToPDF`: Função atualmente configurada para gerar um HTML e instruir o usuário a usar a função de impressão do navegador para "Salvar como PDF". Necessitará de adaptação para gerar PDFs diretamente no Django.
    *   `generateEvaluationReport`: Formata o conteúdo HTML para o relatório de avaliações.
*   **`src/lib/utils.js`**: Contém a função `cn` para mesclar classes do TailwindCSS condicionalmente.

---

## Pontos para Adaptação em Django (Offline)

*   **Banco de Dados:** Substituir `localStorage` por um banco de dados local gerenciado pelo Django (ex: SQLite, PostgreSQL). Isso envolverá a criação de Models no Django correspondentes à estrutura de dados descrita.
*   **Autenticação:** Implementar o sistema de autenticação do Django, mapeando os `users` e `roles` para os usuários e grupos/permissões do Django.
*   **Backend Logic:** Toda a lógica de filtragem, agregação de dados (para relatórios, dashboard), salvamento e recuperação de dados atualmente feita no frontend (nos contextos e componentes React) precisará ser movida para Views e Services no backend Django.
*   **API Endpoints:** Definir APIs (usando Django REST framework, por exemplo) para que o frontend React (se mantido) possa interagir com o backend Django. Se a ideia é um sistema totalmente offline sem um frontend React separado, então a lógica de renderização de templates Django será usada.
*   **Exportação para PDF:** A função `exportToPDF` precisará ser completamente refeita no backend Django usando bibliotecas como ReportLab, WeasyPrint ouxhtml2pdf para gerar PDFs diretamente no servidor.
*   **Gerenciamento de Sessão:** O Django cuidará do gerenciamento de sessão do usuário.
*   **Organograma:** A lógica `buildHierarchy` no frontend pode ser adaptada para uma consulta eficiente no banco de dados do Django para construir a estrutura hierárquica.
*   **Navegação e Rotas:** O `react-router-dom` seria substituído pelo sistema de URLs e Views do Django se o frontend React não for mantido integralmente.

Este documento deve fornecer um bom ponto de partida. Boa sorte com o desenvolvimento em Django!
```