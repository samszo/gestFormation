# Présentation

## Données de l'API

L'API "Recherche BUCFM" est un moteur de recherche sémantique de métiers, compétences ou formations. Elle renvoie les éléments (par exemple les métiers) dont l’intitulé est proche d’une requête en texte libre par le sens plutôt que par mots-clés.

La recherche peut-être faite parmi plusieurs collections distinctes :
- secteurs: constituée des grands domaines du ROME 4.0,
- domaines: constituée des domaines professionnels du ROME 4.0,
- sous domaines: constituée des métiers du ROME 4.0,
- appellations: constituée des appellations du ROME 4.0,
- competences: constituée des macro compétences et des compétences du ROME 4.0,
- certificats: constituée des formations du RNCP et du RS,
- formations: constituée des formations de la base CertifInfo.
 
La proximité par le sens entre une requête et un intitulé correspond à la proximité entre deux vecteurs qui représentent chaque texte. Chaque vecteur est le résultat du modèle de langage "OrdalieTech/Solon-embeddings-large-0.1" (voir https://ordalie.ai/research/solon). 


## Contexte et cas d'usage

- Offrez à vos utilisateurs un moteur de recherche de métiers, compétences ou formations. Sa nature sémantique permet aux utilisateurs de trouver les éléments susceptibles de les intéresser sans nécessairement utiliser le vocabulaire des référentiels de l’orientation professionnelle. Par exemple, la requête "crèche" permet de trouver l’appellation métier "Puériculteur / Puéricultrice".


## Conditions d'utilisation

L’accès à l’API est protégé par authentification. Obtenez vos identifiants auprès de Diagoriente via [https://diagoriente.beta.gouv.fr/contact](https://diagoriente.beta.gouv.fr/contact) en expliquant votre cas d’usage.


## Chiffres clés

- 400000 recherches par mois depuis Août 2024


## Ils ont utilisé l’API

- [Diagoriente](https://plateforme.diagoriente.beta.gouv.fr/) pour aider les personnes en recherche professionnelle à trouver les métiers correspondants à leurs expériences et compétences et pour explorer les secteurs d’activité et les métiers d’avenir.
- [Immersion facilitée](https://immersion-facile.beta.gouv.fr/recherche) pour aider les candidats en recherche d’immersion professionnelle à trouver une entreprise. 
