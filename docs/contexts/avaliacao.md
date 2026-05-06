# Contexto: Avaliação (Assessment)

## Domínio
Representa um conjunto de medições antropométricas realizadas em um atleta em uma data específica.

## Atributos Principais
- **id**: Identificador único (UUID).
- **athleteId**: ID do atleta a quem a avaliação pertence.
- **date**: Data em que a avaliação foi realizada.
- **Medidas Básicas**: Peso (kg) e Altura (cm).
- **Medidas Gerais**: Água corporal (kg), Gordura Visceral (kg), Massa Proteica (kg), Massa Muscular (kg).
- **Dobras Cutâneas (mm)**: Tríceps D, Tríceps E, Subescapular, Tórax, Subaxilar, Supra-ilíaca, Abdominal, Coxa D, Coxa E, Panturrilha D, Panturrilha E.
- **Circunferências (cm)**: Ombro, Peitoral, Braço D, Braço E, Cintura, Quadril, Medial D, Medial E, Panturrilha D, Panturrilha E, Diâmetro Punho, Diâmetro Joelho.

## Fórmulas Utilizadas (Dashboard)
Ao comparar avaliações ou visualizar os dados atuais, as seguintes fórmulas são empregadas:
- **Ossos (kg)**: `3.02 * (400 * (Circuferencia D. Punho / 100 ) * (Circuferencia D. Joelho / 100 ) * ((Altura / 100)^2))^0.712`
- **Gordura (kg)**: `(Peso * Percentual de Gordura) / 100`
- **Massa Livre de Gordura (MLG em kg)**: `Peso - Gordura - Ossos`
- **Somatório de Dobras**: Soma de todas as dobras registradas na avaliação.
- **Percentual de Gordura (%)**: O usuário deve poder escolher entre as fórmulas de Pollock ou Faulkner (atualmente ambas retornam 0 como placeholder para futura implementação).
