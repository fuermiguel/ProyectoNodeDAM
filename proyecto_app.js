//el require se usa para cargar módulos
var fs = require('fs');
var express = require('express');//Modulo express para crear la aplicación
var jade = require('jade');//Módulo motor de platillas
var couchbase = require('couchbase');//Módulo del Couchbase (base de datos)
var _ = require('underscore');//Módulo para extender el manejo de colecciones(Map,array,each,etc.)
var ViewQuery = couchbase.ViewQuery;

var ENTRIES_PER_PAGE = 30;

exports.start = function(config)//Exporto la configuración desde proyecto.js
{
  // Connect with couchbase server.  All subsequent API calls
  // to `couchbase` library is made via this Connection
  var cb = new couchbase.Cluster(config.connstr);//config.connstr = couchbase://localhost
  var db = cb.openBucket(config.bucket);//El config.bucket = nombre del bucket
  db.on('connect', function(err) {//Conectar con la base de datos, con función de manejo de errores
    if(err) {
      console.error("Failed to connect to cluster: " + err);
      process.exit(1);//es un objeto global y puede ser accedido desde cualquier parte
                      //Termina el proceso con el code especificado
    }

    console.log('Couchbase Connected');
  });


//Middleware a nivel de aplicación
//Enlace middleware a una instancia de objeto aplicación utilizando las funciones app.use() y app.METHOD()
  var app = express();//Instancia al objeto de aplicación
  app.use(express.bodyParser());//Modulo de parseo de los archivos JSON
  app.use(express.static('static'));//(imagenes,css,javaScript,etc.) dentro de la carpeta static
  //app.use(express.static(__dirname + '/static'));
  app.set('views', __dirname + '/views');//Especifico el directorio de las views de modo absoluto
  app.set('view engine', 'jade');//Especifico el motor que genera las views "jade"
  //app.locals Objeto que contiene propiedades de las variables locales dentro de la app
  app.locals.pretty = true; //Para embellecer HTMl

//  "app.METHOD(PATH, HANDLER)" Direccionamiento básico (como responde una
//  aplicación a una solicitud)

//res.METHOD métodos de respuesta

  // Index page redirect
  app.get('/', function(req, res) {
    res.redirect('/welcome');//Redirecciona una solicitud
  });

  // Welcome page.
  function welcome(req, res) {
    res.render('welcome');//representa una plantilla de vista
  }
  app.get('/welcome', welcome);//welcome es una plantilla jade

  // List of projects.
  function list_proyectos(req, res) {

    var q = ViewQuery.from('proyecto', 'by_type')
    //proyecto, by_type los cogemos de la view generada manualmente en couchbase server
        .limit(ENTRIES_PER_PAGE)//indica el maxim número de resultados a retornar
        .stale(ViewQuery.Update.BEFORE);//indica que se actualice antes de la consulta
    db.query(q, function(err, values) {//values es un Array<Object> filas retornadas de la consulta
      // 'by_type' view's map function emits proyecto-name as key and value as
      // null. So values will be a list of
      //      [ {id: <proyecto-id>, key: <proyecto-name>, value: <null>}, ... ]

      //Underscore
      //Una biblioteca de utilidades JavaScript moderna que ofrece modularidad, rendimiento y extras.
      //_.pluck(), _.map()
      console.log("***********values*************");
      console.log(values);//{key:"",value:"",id:""}


    //De los documentos retornados de la consulta extraigo los valores del campo "id"
      var keys = _.pluck(values, 'id');

        /*Ejemplo de uso de _.pluck(list, propertyName)

        var stooges = [{name: 'moe', age: 40}, {name: 'larry', age: 50}, {name: 'curly', age: 60}];
        _.pluck(stooges, 'name');
        => ["moe", "larry", "curly"]
      */
console.log("***********keys*************");
console.log(keys);

      //Devuelve una lista de documentos en results
      db.getMulti( keys, function(err, results) {

        /*
        map_.map(list, iteratee, [context]) Alias: collect
        Produces a new array of values by mapping each value in list through
        a transformation function (iteratee). The iteratee is passed three
        arguments: the value, then the index (or key) of the iteration, and
        finally a reference to the entire list.

        _.map([1, 2, 3], function(num){ return num * 3; });
        => [3, 6, 9]
        _.map({one: 1, two: 2, three: 3}, function(num, key){ return num * 3; });
        => [3, 6, 9]
        _.map([[1, 2], [3, 4]], _.first);
        => [1, 3]
        */
console.log("***********results*************");
    console.log(results);

        var proyectos = _.map(results, function(v, k) {
          console.log("***********v*************");
            console.log(v);
            console.log("***********k*************");
              console.log(k);

          v.value.id = k;
          console.log("***********v.value.id*************");
          console.log(v.value.id);
          return v.value;
        });
        console.log("***********proyectos*************");
            console.log(proyectos);
          //Estoy pasando una variable local {'proyectos':proyectos}; a la view
        res.render('index', {'proyectos':proyectos});

      })
    });
  }
  app.get('/proyectos', list_proyectos);

/*

  // Delete a beer document or brewery document. Document `id` is supplied as
  // part of the URL.
  function delete_object( req, res ) {
    db.remove( req.params.object_id, function(err, meta) {
      if( err ) {
        console.log( 'Unable to delete document `' + req.params.object_id + '`' );
      }

      res.redirect('/welcome');
    });
  }
  app.get('/proyectos/delete/:object_id', delete_object);

*/

  // Show individual project document, with all its details. Document `id` is
  // supplied as part of the URL.
  function show_proyecto(req, res) {
    /*
    get(key, options, callback)
    Retrieves a document.

    OpCallback(error,result) Este callback es pasado a todas las single key functions
    retorna una combinación de un CAS y un valor, dependiendo de que operación fue invocada.
    result es el resultado de la operación que fue ejecutada.
    */
    console.log("*************req.param********");
    console.log(req.params);
    db.get( req.params.proyecto_id, function(err, result) {
      var doc = result.value;
      if( doc === undefined ) {
        res.send(404);
      } else {
        doc.id = req.params.proyecto_id;
        var view = {
          'proyecto': doc,
          //'proyectofields': _.map(doc, function(v,k){return {'key':k,'value':v};})
          'proyectofields': _.map(doc, function(v,k){return {k:v};})
        };
        console.log("*************view proyecto********");
        console.log(view.proyecto);
        console.log("*************view proyectofields********");
        console.log(view.proyectofields);
        res.render('show', view.proyecto);
    }
  });
  }
  //Paso una variable en la url poniendo dos puntos y el nombre de la variable.
  app.get('/proyectos/show/:proyecto_id', show_proyecto);

/*
  function search_beer(req, res) {
    var value = req.query.value;
    var q = ViewQuery.from('beer', 'by_name')
        .range(value, value + JSON.parse('"\u0FFF"'))
        .stale(ViewQuery.Update.BEFORE)
        .limit(ENTRIES_PER_PAGE);
    db.query(q, function(err, values) {
      var keys = _.pluck(values, 'id');
      if (keys.length <= 0) {
        return res.send([]);
      }
      db.getMulti(keys, function(err, results) {
        var beers = [];
        for(var k in results) {
          beers.push({
            'id': k,
            'name': results[k].value.name,
            'brewery_id': results[k].value.brewery_id
          });
        }

        res.send(beers);
      });
    });
  };
  app.get('/beers/search', search_beer);
*/

  // Start Express
  app.listen(1337);
  console.log('Server running at http://127.0.0.1:1337/');
}
