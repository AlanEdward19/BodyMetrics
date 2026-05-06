# Contexto: Atleta

## Domínio
Representa os dados demográficos e esportivos básicos de um atleta monitorado pelo sistema. Um atleta atua como a entidade raiz para outros dados, como avaliações e métricas.

## Atributos Principais
- **id**: Identificador único (UUID).
- **name**: Nome completo do atleta.
- **photoUrl** (opcional): URL para a foto de perfil.
- **sector**: Setor em que o atleta atua (texto livre).
- **position**: Posição específica do atleta.
- **category**: Categoria de idade ou nível (ex: Profissional, Sub-20).
- **competitivePhase**: Fase competitiva atual (ex: Competição, Pré-temporada).
- **birthDate**: Data de nascimento.

## Regras de Negócio
- Todo atleta deve possuir um nome, setor, posição, categoria e fase competitiva.
- Um atleta pode ter múltiplas `Avaliações` (Assessment) associadas a ele ao longo do tempo.
- O campo "Número da Camisa" foi depreciado e removido em favor de uma modelagem focada no estado corporal e desempenho.
