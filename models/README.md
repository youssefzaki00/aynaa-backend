# Decisions

## Using default mongo ID or custom uuid ?
I decided to use default mongo ID to avoid complexity of handling uuid with respect of indexes, mapping and lookup.
I will map mongo ID name from "_id" to "id" to improve readability and security
