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
- **Somatório de Dobras**: Soma de todas as dobras registradas na avaliação.
- **Percentual de Gordura (%)**: O usuário deve poder escolher entre as fórmulas de Pollock ou Faulkner.
- **Relação Massa Muscular-Ossos**: `MLG / Ossos` (índice adimensional).
- **Relação Massa Muscular-Gordura**: `MLG / Gordura` (índice adimensional).
- **PVC (Pico de Velocidade de Crescimento)**: `-9.236 + (0.0002708 * Altura * AlturaSentado) - (0.001663 * Idade * Altura) + (0.007216 * Idade * AlturaSentado) + (0.02292 * Peso / Altura)` — requer campo `sittingHeight` preenchido na avaliação.
