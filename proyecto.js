var proyecto_designs = require('./proyecto_designs');
var proyecto_app = require('./proyecto_app');

// connection configuration to pass on to couchbase.connect(). Note that
// while connecting with the server we are also opening the app_gestion_oficina_tecnica
// bucket.
var config = {
    connstr : "http://localhost:8091",
    bucket : 'app_gestion_oficina_tecnica'
}

if( require.main == module ) {
    argv = process.argv.splice(2);
    if( argv[0] === '--setup' ) { // Create the design documents for gestion_oficina_tecnica
        proyecto_designs.setup( config );
    } else if( argv[0] === '--reset' ) {  // Reset what was done by -d option
        proyecto_designs.reset( config );
    } else {
        proyecto_app.start( config );
    }
}
