# Diretrizes para Agentes de IA - Projeto BodyMetrics

## SDD (Spec Driven Development)

Neste projeto, adotamos a abordagem **Spec Driven Development (SDD)**. As seguintes regras devem ser rigorosamente seguidas por qualquer agente de IA:

1. **Contextos Documentados**: Todo novo contexto ou domínio do sistema (ex: "Atleta", "Treinamento", "Nutrição") DEVE ser documentado em um arquivo Markdown sucinto dentro de `docs/contexts/` (ex: `docs/contexts/nome-do-contexto.md`).
2. **Verificação de Contexto**: Antes de iniciar o desenvolvimento ou modificar código relacionado a um domínio de negócio, o agente DEVE verificar se existe um arquivo de contexto aplicável e utilizá-lo para embasar suas decisões.
3. **Atualização Sucinta**: Se o usuário mencionar uma nova regra de negócio, comportamento ou atributo relacionado a um contexto existente, o agente DEVE atualizar o respectivo arquivo Markdown de forma sucinta e objetiva. Evite textos prolixos ou extensos.

## Boas Práticas de Desenvolvimento Web

- **Componentização**: Evite código repetitivo (DRY - Don't Repeat Yourself). Se algo é usado mais de uma vez (como botões, badges, cartões de métrica), extraia para um componente reutilizável.
- **Código Limpo e Organizado**: Sem "código espaguete". Mantenha arquivos pequenos e componentes focados em uma única responsabilidade.
- **Persistência Temporária**: Durante a fase inicial, utilize `localStorage` para persistir dados, abstraído através de Custom Hooks.
- **Design Moderno e Responsivo**: Utilize Vanilla CSS com variáveis para manter consistência no Design System. Priorize estética limpa, sombras suaves e tipografia moderna.
