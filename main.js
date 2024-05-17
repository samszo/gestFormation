import {auth} from './modules/auth.js';
import {appUrl} from './modules/appUrl.js';

//Omeka parameters
let aUrl = new appUrl({'url':new URL(document.location)}),
a = new auth({'navbar':false,
        mail:'samuel.szoniecky@univ-paris8.fr',
        /*
        apiOmk:'http://localhost/omk_genstory_24/api/',
        ident: 'U88iy6ZRDfShexC23K9CGGG0sx6LKYn2',
        key:'XUbZKSuaERYYhy4cIulVbSdItfC1CBMb',
        */
        gCLIENT_ID:'482766138432-i9vp20n7b976n1bbvhg3js130niauog2.apps.googleusercontent.com',
        gAPI_KEY:'AIzaSyB39QRdVAMgoNrnFhon3WO-vRTUTNBTPbc',
        gDISCOVERY_DOC:'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
        gSCOPES:'https://www.googleapis.com/auth/calendar.readonly',
        fctAuthOK:loadCalendars
    });
/*omeka connexion
a.getUser(u=>{
    console.log(u);
});
*/

//gestion des ihm
d3.select("#dateDeb").node().value=new Date().getFullYear()+'-09-01';
d3.select("#dateFin").node().value=(new Date().getFullYear()+1)+'-09-30';

let calHM, calOpt = { range: 13,
        date: { 
            start: new Date(document.getElementById('dateDeb').value),
            end: new Date(document.getElementById('dateFin').value),
            locale: 'fr' 
        },
        domain: {type: 'month'},
        subDomain: {
            type: 'day', 
            label: 'D',
            width: 13,
            height: 13,        
        }
    };

async function loadCalendars(token){
    console.log(token);
    let response;
    try {
      response = await gapi.client.calendar.calendarList.list();
    } catch (err) {
      console.log(err.message);
      return;
    }
    //affiche la liste
    d3.select("#listCalendar").attr("class","nav-item dropdown");
    d3.select("#ddCalendar").selectAll('li').data(response.result.items).enter()
        .append('li').append('a')
            .attr('class',"dropdown-item")
            .text(a=>a.summary)
            .on('click',selectCalendar);
}

function selectCalendar(e,a){
    console.log(a);
    d3.select('#contentDetails').html('<h1>'+a.summary+'</h1>');
    //récupère les events
    try {
        var request = gapi.client.calendar.events.list({
            'calendarId': a.id,
            "singleEvents" : true,
            "orderBy" : "startTime",
            "timeMin":  new Date(document.getElementById('dateDeb').value).toISOString(),
            "timeMax":  new Date(document.getElementById('dateFin').value).toISOString()
          });
        request.execute(rs=>{
            console.log(rs);
            initEvents(rs.items);
        });
    } catch (err) {
        console.log(err.message);
        return;
    }
}

function initEvents(items){
    let events = items.filter(e=>{
        return e.summary.split(' : ').length == 3 ? true : false;
    }), jours, codes, intervenants;
    events.forEach(e => {
        let infos = e.summary.split(' : ');
        e.code = infos[0];
        e.cour = infos[1];
        e.intervenants = infos[2].split(',');
        e.jour = new Date(e.start.dateTime).toISOString();
        e.nbH = Math.abs(new Date(e.end.dateTime) - new Date(e.start.dateTime)) / 36e5;
    });
    jours = d3.groups(events, e => e.jour).map(e=>{
        return {
            'date':e[0],
            'events':e[1],
            'value':d3.sum(e[1], d=>d.nbH)
            }
        });
    console.log(jours);
    calOpt.data = {
            source:jours,
            x: 'date',
            y: d => d.value,        
        };
    calOpt.scale = {
            color: {
              scheme: 'Cool',
              type: 'linear',
              domain: d3.extent(jours, j => j.value)
            }
        }        

    calHM = new CalHeatmap();    
    calHM.paint(calOpt);

}


