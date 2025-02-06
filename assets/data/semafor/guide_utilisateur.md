# Guide d’utilisation

Ce guide présente les fonctionnalités du moteur de recherche en les illustrant d’exemples d’appels API pour apprendre à s’en servir. Il couvre :

- [L’authentification](#authentification)
- [La recherche](#effectuer-une-recherche-de-m%C3%A9tier-comp%C3%A9tence-ou-formation)
- [Les feedbacks](#renvoyer-des-feedbacks-pour-nous-aider-%C3%A0-%C3%A9valuer-la-qualit%C3%A9-des-r%C3%A9sultats-et-am%C3%A9liorer-le-moteur)


## Authentification

L’accès au moteur de recherche est protégé par authentification en suivant le protocole OAuth2. L’authentification consiste à :

1. obtenir un identifiant et mot de passe pour votre service en en faisant la demande [ici](https://diagoriente.beta.gouv.fr/contact), 
2. les utiliser pour obtenir un token auprès de notre serveur d’authentification
3. inclure votre token aux appels API vers notre moteurs de recherche.

Une fois que vous avez obtenu vos identifiants sous la forme d’une clé et d’un code secret, vous pouvez obtenir un token auprès de notre serveur d’authentification :

```sh
curl -X POST 'https://auth.prod.analytics.diagotech.dev/realms/esi-auth-keycloack/protocol/openid-connect/token' \
    -d "client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET&grant_type=client_credentials" \
    -H "Content-Type: application/x-www-form-urlencoded"
```
curl -X POST 'https://auth.staging.analytics.diagotech.dev/realms/esi-auth-keycloack/protocol/openid-connect/token' \
          -d 'client_id=EXT_semafor_samuel_szoniecky&client_secret=3VQClgP742v46usRUyqljJc01oefQnfN&grant_type=client_credentials' \
          -H "Content-Type: application/x-www-form-urlencoded"

Le serveur répond avec un object JSON qui contient une propriété `access_token` dont vous aurez besoin pour les appels vers le moteur de recherche.

```json
{
  "access_token": "aBcDe0123",
  "expires_in": 36000,
  "refresh_expires_in": 0,
  "token_type": "Bearer",
  "not-before-policy": 0,
  "scope": "profile email"
}

```


## Effectuer une recherche de métier, compétence ou formation

Effectuer une recherche consiste à envoyer une requête sous forme d’un texte libre, à choisir une collection à rechercher et à recevoir une liste de résultats dont l’intitulé est proche de la requête par le sens.

Les collections disponibles sont: `Secteurs`, `Domaines`, `SousDomaines`, `Competences`, `Appellations`, `Certificats` et `Formations` (voir la [présentation de l’API](./presentation.md) pour une définition de chaque collection).

L’appel suivant permet d’obtenir 2 appellations métiers proche de la requête "crèche".
 
```sh
ACCESS_TOKEN="aBcDe0123"
curl -X 'GET' \
  'https://recherche-referentiel-v2.prod.analytics.diagotech.dev/search/Appellations?query=cr%C3%A8che&nb_results=7' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

La chaîne de charactère "aBcDe0123" correspond à la valeur de l’acces_token obtenue à l’[authentification](#authentification)

L’appel renvoie un objet json avec une propriété `search_results` qui contient la liste des résultats triés par proximité sémantique décroissante avec la requête. Chaque résultat a une propriété `text`, le texte de référence comparé à la requête pour calculer la similarité sémantique et le score de similarité. La propriété `data` contient des données supplémentaires qui peuvent varier selon la collection requêtée, code le code ROME pour les sous domaines ou le code ogr pour les appellations. Pour plus d’information, se référer à la documentation swagger de référence de l’API.

```json
{
  "search_results": [
    {
      "text": "Puériculteur / Puéricultrice responsable de crèche",
      "similarity": 0.017406986649946554,
      "position": 1,
      "data": {
        "_key": "c3023ad6-c7e5-4043-8711-689d21d5891e",
        "titre": "Puériculteur / Puéricultrice responsable de crèche",
        "item_type": "Appellations",
        "code_ogr": "18242"
      }
    },
    {
      "text": "Puériculteur / Puéricultrice",
      "similarity": -0.010723375523153944,
      "position": 2,
      "data": {
        "_key": "14982f77-b59b-49e1-bf23-181436aa01b7",
        "titre": "Puériculteur / Puéricultrice",
        "item_type": "Appellations",
        "code_ogr": "18238"
      }
    }
  ],
  "search_id": "9261288f-811a-49ba-9aae-7a9062a90426"
}
```


## Renvoyer des feedbacks pour nous aider à évaluer la qualité des résultats et améliorer le moteur

Des routes de feedback vous permettent de nous envoyer des événements signifiant que vos utilisateurs ont interagi avec un résultat de la recherche. En les utilisant, vous nous permettez d’évaluer la pertinence des résultats du moteur et participez à notre démarche d’amélioration.

La route `/feedback/search/event/user_selects_result` vous permet de signifier qu’un utilisateur a sélectionné un résultat qui l’intéressait pour en savoir plus, sans l’engager d’avantage. Par exemple, il a cliqué sur un intitulé de métier pour lire sa description.

La route `/feedback/search/event/user_acts_on_result` vous permet de signifier qu’un utilisateur a entamé une démarche supplémentaire à partir d’un résultat de recherche qui l’engage d’avantage, confirmant son intérêt. Par exemple, il a sélectionné un métier pour l’ajouter à la liste de ses expériences, il a entammé une démarche de candidature pour une offre d’emploi d’un métier proposé, il a fait une demande de rendez-vous pour une formation, etc.

Les deux routes s’appellent de la même manière. Elles prennent en paramètre l’identifiant de la recherche et le résultat concernés. L’identifiant est à récupérer dans la propriété `search_id` reçue en réponse à une recherche. Par exemple:

```sh
curl -X 'POST' \
  'https://recherche-referentiel-v2.prod.analytics.diagotech.dev/feedback/search/event/user_acts_on_result?search_id=9261288f-811a-49ba-9aae-7a9062a90426' \
  -H 'accept: application/json' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '    {
      "text": "Puériculteur / Puéricultrice",
      "similarity": -0.010723375523153944,
      "position": 2,
      "data": {
        "_key": "14982f77-b59b-49e1-bf23-181436aa01b7",
        "titre": "Puériculteur / Puéricultrice",
        "item_type": "Appellations",
        "code_ogr": "18238"
      }
    }
'
```