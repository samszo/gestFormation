import {auth} from './modules/auth.js';
import {appUrl} from './modules/appUrl.js';

//Omeka parameters
let aUrl = new appUrl({'url':new URL(document.location)}),
a = new auth({'navbar':d3.select('#navbarMain'),
        mail:'samuel.szoniecky@univ-paris8.fr',
        apiOmk:'http://localhost/omk_gestForma/api/',
        ident: 'RVkJ1ELnrfDcvV0u2geUQuu01EvUlVsw',
        key:'B2WdPBuqwJKc0a2vN8YMJReheMO6xVuR',
        gCLIENT_ID:'482766138432-i9vp20n7b976n1bbvhg3js130niauog2.apps.googleusercontent.com',
        gAPI_KEY:'AIzaSyB39QRdVAMgoNrnFhon3WO-vRTUTNBTPbc',
        gDISCOVERY_DOC:'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
        gSCOPES:'https://www.googleapis.com/auth/calendar.readonly',
        fctAuthOK:[loadCalendars,loadParcours]
    });

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


function loadParcours(){
    let response, clsParcours;
    try {
        clsParcours = a.omk.getClassByTerm('fup8:Parcours');
        response = a.omk.searchItems('resource_class_id='+clsParcours['o:id']);
    } catch (err) {
        console.log(err.message);
        return;
    }
    //affiche la liste
    d3.select("#listParcours").attr("class","nav-item dropdown");
    d3.select("#ddParcours").selectAll('li').data(response).enter()
        .append('li').append('a')
            .attr('class',a=>a['fup8:hasAgenda'] ? "dropdown-item bg-success text-white" : "dropdown-item bg-danger text-white")
            .text(a=>a['o:title'])
            .on('click',selectParcours);
}          


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
    d3.select('#contentFormations').html('<h1>'+a.summary+'</h1>');
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

function selectParcours(e,p){
    console.log(p);
    d3.select('#contentFormations').html('<iframe src='+a.omk.getItemAdminLink(p)+'></iframe>');
    //récupère les events
    try {
        var request = gapi.client.calendar.events.list({
            'calendarId': p['fup8:hasAgenda'][0]['@value'],
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
    }), jours, cours, interventions=[], intervenants,
    optDate = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      
      events.forEach(e => {
        let infos = e.summary.split(' : ');
        e.code = infos[0];
        e.cours = infos[1];
        e.start.date = new Date(e.start.dateTime);
        e.end.date = new Date(e.end.dateTime);
        e.intervenants = infos[2].split(',');
        e.jour = new Intl.DateTimeFormat("fr-FR", optDate).format(e.start.date);//new Date(e.start.dateTime).toISOString();
        e.nbH = Math.abs(e.end.date - e.start.date) / 36e5;
        e.intervenants.forEach(intv=>{
            interventions.push({'intervenant':intv,'code':e.code,'cours':e.cours
                ,'jour':e.jour 
                ,'début':e.start.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                ,'fin':e.end.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                , 'nb Heure':e.nbH
            })
        })
    });
    console.log('interventions',interventions);
    jours = d3.groups(events, e => e.jour).map(e=>{
        return {
            'date':e[0],
            'events':e[1],
            'value':d3.sum(e[1], d=>d['nb Heure'])
            }
        });
    console.log('jours',jours);

    intervenants = d3.groups(interventions, i => i.intervenant).map(i=>{
        return {
            'label':i[0],
            'events':i[1],
            'value':d3.sum(i[1], d=>d.nbH)
            }
        });
    intervenants = d3.sort(intervenants, (d) => d.label);
    console.log('intervenants',intervenants);
    showListe(d3.select('#contentIntervenants'),intervenants);

    cours = d3.groups(events, c => c.code).map(c=>{
        return {
            'label':c[0],
            'events':c[1],
            'value':d3.sum(c[1], d=>d.nbH)
            }
        });
    cours = d3.sort(cours, (d) => d.label);        
    console.log('cours',cours);
    showListe(d3.select('#contentCours'),cours);


    setCalHeatmap(jours);
    
    showInterventions(interventions);    
}

function showListe(s,data){
    s.select('ul').remove();
    s.append('ul').attr("class","list-group").selectAll('li').data(data).enter().append('li')
        .attr("class","list-group-item d-flex justify-content-between align-items-center")
        .text(d=>d.label)
        .append('span').attr('class',"badge text-bg-primary rounded-pill").text(d=>d.value);
}

function setCalHeatmap(jours){
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
    d3.select('#cal-heatmap').select('svg').remove();        
    calHM = new CalHeatmap();    
    calHM.on('click', (event, timestamp, value) => {
        console.log(
          'On <b>' +
            new Date(timestamp).toLocaleDateString() +
            '</b>, Le nombre heure ' +value
        );
      });    
    calHM.paint(calOpt);
}

function showInterventions(rs){
    let pane = d3.select('#tableMain'), 
        cont = pane.append('div')
            .attr('class',"container-fluid"),
        rectCont = d3.select('#contentMap').node().getBoundingClientRect(),
        rectCal = d3.select('#cal-heatmap').node().getBoundingClientRect(),
        div = cont.append('div').attr('class',"row").append('div').attr('class',"col-12")
            .append('div').attr('class',"clearfix"),   
        headers = Object.keys(rs[0]);
    const hot = new Handsontable(div.node(), {
        data:rs,
        rowHeaders: true,
        colHeaders: headers,
        height: 600,//(rectCont.height-rectCal.height),
        rowHeights: 40,
        selectionMode:'single',
        manualRowResize: true,
        className:'htJustify',
        renderAllRows:true,
        customBorders: true,
        multiColumnSorting: true,
        filters: true,
        allowInsertColumn: false,
        copyPaste: false,
        search: true,    
        editor: 'text',
        columns: getCellEditor(headers),
        licenseKey: 'non-commercial-and-evaluation' // for non-commercial use only
    });    
}

function getCellEditor(headers){
    let editors = [];
    headers.forEach(h=>{
        switch (h) {
          case 'elision':
            editors.push({data:h, type: 'checkbox',uncheckedTemplate: '0',checkedTemplate: '1'})                  
            break;              
          default:
            editors.push({data:h, type: 'text'})                  
            break;
        }
      })
    return editors;
  }




