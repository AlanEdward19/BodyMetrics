# Contexto: Avaliação (Assessment)

## Domínio
Representa um conjunto de medições antropométricas realizadas em um atleta em uma data específica.

## Atributos Principais
- **id**: Identificador único (UUID).
- **athleteId**: ID do atleta a quem a avaliação pertence.
- **date**: Data em que a avaliação foi realizada.
- **Medidas Básicas**: Peso (kg), Altura (cm) e Altura Sentado (cm).
- **Dobras Cutâneas (mm)**: Tríceps D, Tríceps E, Subescapular, Tórax, Subaxilar, Supra-ilíaca, Abdominal, Coxa D, Coxa E, Panturrilha D, Panturrilha E.
- **Circunferências (cm)**: Ombro, Peitoral, Braço D, Braço E, Cintura, Quadril, Medial D, Medial E, Panturrilha D, Panturrilha E, Diâmetro Punho, Diâmetro Joelho.

## Fórmulas Utilizadas (Dashboard)
Ao comparar avaliações ou visualizar os dados atuais, as seguintes fórmulas são empregadas:
- **Ossos (kg)**: `3.02 * (400 * (Circuferencia D. Punho / 100 ) * (Circuferencia D. Joelho / 100 ) * ((Altura / 100)^2))^0.712`
- **Gordura (kg)**: `(Peso * Percentual de Gordura) / 100`
- **Massa Livre de Gordura (MLG em kg)**: `Peso - Gordura - Ossos`
- **Massa Muscular (kg)**: `(Altura / 100) * ((0.00744 * (Relação M/O Braço^2)) + (0.00088 * (Circunferência Braço Corrigida^2)) + (0.00441 * (Tornozelo^2))) + (2.4 * Sexo) - (0.048 * Idade) + Raça + 7.8` onde Relação M/O Braço é `Circunferência Braço Corrigida / Diâmetro Punho`, Sexo é 1 para masculino e 0 para feminino, Raça é 0 para branco, 1.1 para negro e -2 para asiático, e Tornozelo é o valor registrado de circunferência/diâmetro do tornozelo.
- **Somatório de Dobras**: Soma de todas as dobras registradas na avaliação.
- **Percentual de Gordura (%)**: O usuário deve poder escolher entre as fórmulas de Pollock ou Faulkner.
- **Relação Massa Muscular-Ossos**: `MLG / Ossos` (índice adimensional).
- **Relação Massa Muscular-Gordura**: `MLG / Gordura` (índice adimensional).
- **PVC (Pico de Velocidade de Crescimento)**: `-9.236 + (0.0002708 * Altura * AlturaSentado) - (0.001663 * Idade * Altura) + (0.007216 * Idade * AlturaSentado) + (0.02292 * Peso / Altura)` — requer campo `sittingHeight` preenchido na avaliação.

## Comportamento no Preenchimento de Nova Avaliação
- **Comparação em Tempo Real**: Durante o input dos campos no formulário de Nova Avaliação ou Edição, o sistema exibe abaixo de cada campo o valor registrado na avaliação anterior imediatamente anterior.
