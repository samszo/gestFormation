export class gapi {
    constructor(params={}) {
        var me = this;
        this.init = function () {
        // TODO(developer): Set to client ID and API key from the Developer Console
        const CLIENT_ID = '482766138432-i9vp20n7b976n1bbvhg3js130niauog2.apps.googleusercontent.com';
        const API_KEY = 'AIzaSyB39QRdVAMgoNrnFhon3WO-vRTUTNBTPbc';

        // Discovery doc URL for APIs used by the quickstart
        const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

        // Authorization scopes required by the API; multiple scopes can be
        // included, separated by spaces.
        const SCOPES = 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events';

        let tokenClient;
        let gapiInited = false;
        let gisInited = false;
        
            d3.select('#loading-container').remove();
            main = d3.select('body').append('div')
                .attr('id','loading-container').attr('tabindex',-1);
            main.html(html);
            loading = main.select("#ws-loading");
            me.hide(true);
        }
                
        this.show = function(){
            loading.style("display", "inline-block");
            setTimeout(function(){
                curwait ++;
            }, 1000);
        }
        this.hide = function(all=false){
            if(all)curwait=0;
            curwait --;
            if(curwait<1){
                loading.style("display", "none");
                curwait=0;
            }       
        }

        this.init();
    }
}
