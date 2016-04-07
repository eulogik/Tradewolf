var loopback = require('loopback');
var boot = require('loopback-boot');
var request = require('request');

var app = module.exports = loopback();

//custom vars
var time_interval_in_miliseconds = 1500;
var apiUri = "http://finance.google.com/finance/info?client=ig&q=";
var marketOpen ={"NSE": true,"BSE": true};


app.start = function() {
  // start the web server
  return app.listen(function() {
    app.emit('started');
    var baseUrl = app.get('url').replace(/\/$/, '');
    console.log('Web server listening at: %s', baseUrl);
    if (app.get('loopback-component-explorer')) {
      var explorerPath = app.get('loopback-component-explorer').mountPath;
      console.log('Browse your REST API at %s%s', baseUrl, explorerPath);

      //custom code here
      app.models.Symbols.find({},function(err,symbols){
        if(err)
        console.log(err);

        //success

        //timer here
        var task_is_running = false;
        setInterval(function(){
            if(!task_is_running){
                task_is_running = true;
                for(i in symbols){
                  //console.log(symbols[i].market+":"+symbols[i].name);

                  if(marketOpen[symbols[i].market])
                  {
                  //request data from apiUri
                    request(apiUri+symbols[i].market+":"+symbols[i].name, function (error, response, body) {
                        if (!error && response.statusCode == 200) {
                            //console.log(body); // Show the response.
                            q = JSON.parse(body.substr(3));
                            q = q[0];
                            q.qid = q.id;
                            delete q.id;
                            //console.log(q);
                            console.log(Math.abs(new Date().getTime() - new Date(q.lt_dts).getTime())/3600000);

                            app.models.Quotes.create(q, function(err, q){
                              if(err)
                              console.log(err);

                              //success
                              console.log("got "+symbols[i].market+":"+symbols[i].name);
                            });
                        }
                    });
                  }

                }
                task_is_running = false;
            }
        }, time_interval_in_miliseconds);

      });


      //custom code ends here

    }
  });
};

// Bootstrap the application, configure models, datasources and middleware.
// Sub-apps like REST API are mounted via boot scripts.
boot(app, __dirname, function(err) {
  if (err) throw err;

  // start the server if `$ node server.js`
  if (require.main === module)
    app.start();
});
