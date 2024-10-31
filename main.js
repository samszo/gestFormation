import {auth} from './modules/auth.js';
import {appUrl} from './modules/appUrl.js';
import {modal} from './modules/modal.js';
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
import {loader} from './modules/loader.js';


//Omeka parameters
let ldr = new loader();
ldr.show();
let aUrl = new appUrl({'url':new URL(document.location)}),
rsParcours, rsEC, rsEnseignants, rsInterventions, rsJours, rsCours, rsGantt, agenda,
editorEvent,
optDate = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  },
a = new auth({'navbar':d3.select('#navbarMain'),
        mail:'acehn@univ-paris8.fr',
        apiOmk:'http://localhost/omk_gestForma/api/',
        //apiOmk:'../api/',
        ident: 'Fe82ZlMwNP8KR88BKWzGNnF7eS5qChwr',
        key:'Jo5RZc9S3qr79GAe2TZk9UBakWcZbP48',
        //
        gCLIENT_ID:'482766138432-i9vp20n7b976n1bbvhg3js130niauog2.apps.googleusercontent.com',
        gAPI_KEY:'AIzaSyB39QRdVAMgoNrnFhon3WO-vRTUTNBTPbc',
        gDISCOVERY_DOC:'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
        gSCOPES:'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events',
        fctAuthOK:[loadCalendars,loadParcours]
        //
    });

/*chargement données locales
d3.json("assets/data/interventions.json").then(rs=>{
    rsInterventions = rs;
    createGantt(rsInterventions);
})
*/

//gestion des ihm
d3.select("#dateDeb").node().value=new Date().getFullYear()+'-09-01';
d3.select("#dateFin").node().value=(new Date().getFullYear()+1)+'-09-30';
d3.select('#btnRefreshData').on('click', () => {
    d3.select(".list-group-item.active").attr('class',"list-group-item").attr("aria-current",false);
    setCalHeatmap(rsJours);
    showInterventions(rsInterventions);  
    createGantt(rsCours);  
});


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
    let clsParcours, clsEC, clsEnseignant;
    try {
        clsParcours = a.omk.getClassByTerm('fup8:Parcours');
        rsParcours = a.omk.getAllItems('resource_class_id='+clsParcours['o:id']);
        clsEC = a.omk.getClassByTerm('fup8:EC');
        rsEC = a.omk.getAllItems('resource_class_id='+clsEC['o:id']);
        clsEnseignant = a.omk.getClassByTerm('fup8:Enseignant');
        rsEnseignants = a.omk.getAllItems('resource_class_id='+clsEnseignant['o:id']);
        a.omk.loader.hide(true);
    } catch (err) {
        console.log(err.message);
        return;
    }
    //affiche la liste des parcours
    d3.select("#listParcours").attr("class","nav-item dropdown");
    d3.select("#ddParcours").selectAll('li').data(rsParcours).enter()
        .append('li').append('a')
            .attr('class',a=>a['fup8:hasAgenda'] ? "dropdown-item bg-success text-white" : "dropdown-item bg-danger text-white")
            .text(a=>a['o:title'])
            .on('click',selectParcours);
    //affiche le bouton pour rafraichir les data
    d3.select('#btnRefreshData').attr("class","btn btn-danger");
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
            agenda = rs;
            agenda.id = p['fup8:hasAgenda'][0]['@value'];
            initEvents(rs.items);
        });
    } catch (err) {
        console.log(err.message);
        return;
    }
}

function initEvents(items){
    if(!items || !items.length){
        let mMessage = new modal();
        mMessage.setBody('<h3>Erreur : récupération des évènements</h3><p>Merci de vous reconnecter</p>');
        mMessage.setBoutons([{'name':"Close"}])                
        mMessage.show();
    }

    let events = items.filter(e=>{
        return e.summary.split(' : ').length == 3 ? true : false;
    }), jours, cours, intervenants;
    rsInterventions=[];      
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
            rsInterventions.push({'intervenant':intv,'code':e.code,'cours':e.cours
                ,'dateStart':e.start.date
                ,'gEvent': e
                ,'jour':e.jour 
                ,'début':e.start.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                ,'fin':e.end.date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                ,'nb Heure':e.nbH
            })
        })
    });
    console.log('rsInterventions',rsInterventions);
    rsJours = d3.groups(events, e => e.jour).map(e=>{
        return {
            'date':d3.min(e[1], d=>d.start.date),
            'events':e[1],
            'value':d3.sum(e[1], d=>d.nbH)
            }
        });
    console.log('jours',jours);

    intervenants = d3.groups(rsInterventions, i => i.intervenant).map(i=>{
        let item = rsEnseignants.filter(e=>e['o:title']==i[0]);
        item = item.length ? item[0] : null;       
        return {
            'label':i[0],
            'oItem':item,
            'events':i[1],
            'value':d3.sum(i[1], d=>d['nb Heure'])
            }
        });
    intervenants = d3.sort(intervenants, (d) => d.label);
    console.log('intervenants',intervenants);
    showListe(d3.select('#contentIntervenants'),intervenants);

    rsCours = d3.groups(rsInterventions, c => c.code).map(c=>{        
        let item = rsEC.filter(e=>e['fup8:code'][0]['@value']==c[0]);
        item = item.length ? item[0] : null;       
        return {
            'label':c[0],
            'oItem':item,
            'events':c[1],
            'value':d3.sum(c[1], d=>d['nb Heure'])
            }
        });
    rsCours = d3.sort(rsCours, (d) => d.label);        
    console.log('cours',rsCours);
    showListe(d3.select('#contentCours'),rsCours);

    setCalHeatmap(rsJours);
    showInterventions(rsInterventions);
    createGantt(rsCours);
    
}

function showListe(s,data){
    s.select('ul').remove();
    let li = s.append('ul').attr("class","list-group").selectAll('li').data(data).enter().append('li')
        .attr("class","list-group-item"),
    div = li.append('div').attr("class","d-flex w-100 justify-content-between");
    div.append('span').attr('class',"badge text-bg-primary rounded-pill")
        .style('height','fit-content')   
        .text(d=>d.oItem && d.oItem['fup8:vhec'] ? d.oItem['fup8:vhec'][0]['@value']:'');    
    div.append('h5').attr('class',"mb-1")    
        .text(d=>d.oItem && d.oItem ? d.oItem['o:title'] : d.label)
    div.append('span')
        .attr('class',d=>{
            let vhec = d.oItem && d.oItem['fup8:vhec'] ? parseInt(d.oItem['fup8:vhec'][0]['@value']):d.value,
                color = d.value-vhec==0 ? 'success' : 'danger';  
            return "badge text-bg-"+color+" rounded-pill";
        })
        .text(d=>d.value)    
        .style('cursor','zoom-in')
        .style('height','fit-content')
        .on('click',selectItemListe);
    li.append('a').attr('class',"mb-1")
        .attr('target','_blank')
        .attr('href',d=>d.oItem ? a.omk.getItemAdminLink(d.oItem) : '')    
        .text(d=>d.oItem ? 'Voir les détails' : '')
}
function selectItemListe(e,d){
    console.log('selectItemListe',d);
    d3.select(".list-group-item.active").attr('class',"list-group-item").attr("aria-current",false);
    d3.select(e.currentTarget.parentNode.parentNode).attr('class',"list-group-item active").attr("aria-current",true);

    showInterventions(d.events);

    let jours = d.events.map(e=>{
        return {
            'date':Date.parse(e.dateStart),
            'events':e,
            'value':e['nb Heure']
            }
        });
    setCalHeatmap(jours);

    let cours = d3.groups(d.events, c => c.code).map(c=>{        
        let item = rsEC.filter(e=>e['fup8:code'][0]['@value']==c[0]);
        item = item.length ? item[0] : null;       
        return {
            'label':c[0],
            'oItem':item,
            'events':c[1],
            'value':d3.sum(c[1], d=>d['nb Heure'])
            }
        });
    createGantt(cours);


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
        //filtre les rsInterventions.
        let jour = new Intl.DateTimeFormat("fr-FR", optDate).format(timestamp),
            interventions = rsInterventions.filter(i=>i.jour==jour);
        showInterventions(interventions);
      });    
    calHM.paint(calOpt);
}

function showInterventions(rs){
    d3.select('#tableMain').select('div').remove();
    if(!rs.length)return;
    let pane = d3.select('#tableMain'), 
        cont = pane.append('div')
            .attr('class',"container-fluid"),
        rectCont = d3.select('#contentMap').node().getBoundingClientRect(),
        rectCal = d3.select('#cal-heatmap').node().getBoundingClientRect(),
        buttonGroup = cont.append('div').attr('class',"row my-2")
            .append('div').attr('role',"group").attr('class',"btn-group"),
        buttonCSV = buttonGroup.append('button').attr('type',"button").attr('class',"btn btn-danger mx-1")
            .html('<i class="fa-solid fa-file-export"></i>').on('click', () => {
            exportPlugin.downloadFile('csv', {
                bom: false,
                columnDelimiter: ',',
                columnHeaders: false,
                exportHiddenColumns: true,
                exportHiddenRows: true,
                fileExtension: 'csv',
                filename: 'gestFormation_'+agenda.summary+'_[YYYY]-[MM]-[DD]',
                mimeType: 'text/csv',
                rowDelimiter: '\r\n',
                rowHeaders: true
            });
        }),
        buttonCopy = buttonGroup.append('button').attr('type',"button").attr('class',"btn btn-danger mx-1")
            .html('<i class="fa-solid fa-copy"></i>').on('click', () => {
                const exportedString = exportPlugin.exportAsString('csv', {
                    bom: false,
                    columnDelimiter: ',',
                    columnHeaders: true,
                    exportHiddenColumns: true,
                    exportHiddenRows: true,
                    rowDelimiter: '\r\n',
                    rowHeaders: true
                });            
                console.log(exportedString);
                navigator.clipboard.writeText(exportedString);
        }),             
        div = cont.append('div').attr('class',"row").append('div').attr('class',"col-12")
            .append('div').attr('class',"clearfix"),   
        headers = Object.keys(rs[0]);
    const hot = new Handsontable(div.node(), {
        data:rs,
        rowHeaders: true,
        colHeaders: headers,
        height: 600,//(rectCont.height-rectCal.height),
        rowHeights: 40,
        selectionMode:'range',
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
        hiddenColumns: {
            columns:headers.map((h,i)=>h=='dateStart'||h=='gEvent' ? i : null).filter(k=>k!=null)
        },

        licenseKey: 'non-commercial-and-evaluation' // for non-commercial use only
    });
    const exportPlugin = hot.getPlugin('exportFile');
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

  async function createGantt(rs){
    rsGantt = rs;
    mermaid.initialize({ startOnLoad: false,theme: 'dark', });
    d3.select("#gantt").select('pre').remove();
    let graph = d3.select("#gantt").append('pre').attr('id','mermaidGraph').attr("class","mermaid");

    let graphCode = `gantt
    title ${agenda.summary}
    tickInterval 1week
    axisFormat %m/%y
    dateFormat  YYYY-MM-DD`;

    rs.forEach((c,i)=>{
        graphCode += `
            section ${c.oItem["o:title"]}`;
        c.events.forEach((e,j)=>{
            let dt = new Date(e.dateStart).toISOString().split('T')[0];
            graphCode += `
            ${e.cours} : t_${i}_${j}, ${dt}, ${e['nb Heure']}h `;
        })
    })

    //render graphCode
    console.log(graphCode);        
    graph.html(graphCode);
    await mermaid.run({
        querySelector: '#mermaidGraph',
      });

    //ajoute les relations et les intéractions
    let gRela = d3.select(d3.select('#t_0_0').node().parentNode.parentNode).append('g').attr('id','gRela'),
       markerStyle="stroke-width:3px;stroke-opacity:1;fill-opacity:1";
    rs.forEach((c,i)=>{
        c.events.forEach((e,j)=>{
            //récupère les taches
            let t0 = d3.select('#t_'+i+'_'+j), 
                t1 = j < c.events.length-1 ? d3.select('#t_'+i+'_'+(j+1)) : null,
            // et les propriétés graphiques
                pg0 = t0.node().getBBox(), 
                pg1 = t1 ? t1.node().getBBox() : null;
            //ajoute les intéractions
            t0.style('cursor','zoom-in')
                .on('click',showEvent)
            //ajoute une ligne entre les deux
            if(pg1){
                gRela.append("path").attr('id','rela_'+i+'_'+j+'_'+i+'_'+(j+1))
                .attr('d', d3.line()( [[pg0.x, pg0.y+pg0.height], [pg1.x, pg1.y]]))
                    .attr('stroke', 'red')                
                    .attr('style',markerStyle);    
            }
        })
    })
  }

  async function showEvent(e,d){
    let ids = e.currentTarget.id.split('_'),
        cour = rsGantt[ids[1]],
        tache = cour.events[ids[2]];
    console.log('showEvent',tache);
    let mMessage = new modal({'titre':tache.code+' : '+(cour.oItem ? cour.oItem["o:title"] : '')}),
        body = `<div class="card text-start">
            <div class="card-header">
            ${tache.jour} : ${tache.début} -> ${tache.fin}
            <a href="${tache.gEvent.htmlLink}" target="_blank" class="btn btn-primary"><i class="fa-regular fa-calendar-check"></i></a>
            </div>
            <div class="card-body">
                <h5 class="card-title">${tache.intervenant}</h5>
                <div class="mb-3">
                    <label for="inptCours" class="form-label">Titre du cours</label>
                    <input type="text" class="form-control" id="inptCours" value="${tache.cours}">
                </div>
                <div class="mb-3">
                    <label for="inptLocalisation" class="form-label">Localisation</label>
                    <input type="text" class="form-control" id="inptLocalisation" value="${tache.gEvent.location ? tache.gEvent.location : ''}">
                </div>
                <input type="hidden" id="idEvent" name="idEvent" value="${e.currentTarget.id}" />
                <div id="eventEditor">
                ${tache.gEvent.description ? tache.gEvent.description : ''}
                </div>
            </div>
        </div>`;
        mMessage.setBody(body);
        mMessage.setBoutons([{'name':"Fermer"},{'name':"Modifier",'fct':patchEvent,'class':'btn-danger'}])                
        mMessage.show();

        editorEvent = await ClassicEditor
            .create( document.querySelector( '#eventEditor' ) )
            .catch( error => {
                console.error( error );
            } );
  }

  function patchEvent(){

    let modif=false, body = d3.select('#modalGenerateur').select('.card-body'),
        idEvent = body.select('#idEvent').node().value,
        ids = idEvent.split('_'),
        cour = rsGantt[ids[1]],
        tache = cour.events[ids[2]],
        inpCours = body.select('#inptCours').node().value,
        inpLocalisation = body.select('#inptLocalisation').node().value,
        inptDescription = editorEvent.getData(),
        event = gapi.client.calendar.events.get({"calendarId": agenda.id, "eventId": tache.gEvent.id});
        
    if(inpCours!=tache.cours){
        event.summary = tache.gEvent.summary.replace(tache.cours, inpCours);
        modif=true;
    }
    if(inpLocalisation!=tache.gEvent.location){
        event.location = inpLocalisation;
        modif=true;
    }
    if(inptDescription!=tache.gEvent.description){
        event.description = inptDescription;
        modif=true;
    }
    if(modif){
        var request = gapi.client.calendar.events.patch({
            'calendarId': agenda.id,
            'eventId': tache.gEvent.id,
            'resource': event
        });
        
        request.execute(function (reponse) {
            console.log(reponse);
            tache.cours=inpCours;
            tache.gEvent.summary=reponse.summary;
            tache.gEvent.location=reponse.location;
            tache.gEvent.description=reponse.description;
        });
    
    }
    

  }