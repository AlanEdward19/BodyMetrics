# Contexto: Atleta

Este arquivo define o contexto e as regras de negócio para a entidade "Atleta" na plataforma BodyMetrics.

## Estrutura de Dados (Inicial)
- `id` (string): Identificador único (UUID).
- `name` (string): Nome do atleta.
- `photoUrl` (string, opcional): URL da foto do perfil.
- `number` (number): Número da camisa (ex: #10).
- `position` (string): Posição em campo (ex: "Meio-campo", "Goleiro", "Atacante").
- `category` (string): Categoria (ex: "Profissional", "Base").
- `competitivePhase` (string): Fase competitiva atual (ex: "Competição", "Pré-temporada").

## Regras de Negócio Iniciais
- **Armazenamento**: Por enquanto, todos os dados de atletas devem ser salvos exclusivamente em `localStorage`.
- **Análise (Dashboard)**: O dashboard foca em métricas antropométricas (Peso, % Gordura, Massa Magra) extraídas de sua avaliação mais recente. Dados fictícios serão usados até a integração das fórmulas reais.
- **Cadastro**: Novos atletas são adicionados através de um formulário simplificado.
