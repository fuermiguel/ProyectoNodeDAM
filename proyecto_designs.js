var couchbase = require('couchbase');

// Setup design documents for projects to index project-documents
// based on projects-types.

// The following functions acts synchronously so that we can know when to safely
//   exit.  This is a workaround for a current bug in the client that stops node
//   from gracefully exiting while a Couchbase connection is active.

exports.setup = function( config ) {
    var proyecto_by_type = {
        map : [ 'function(doc, meta) {',
                    'if (doc.type && doc.type == "plan_de_emergencia") { ',
                        'emit(doc.docId, null); }',
                '}'
              ].join('\n')
    }


    var bscluster = new couchbase.Cluster(config.connstr);
    var bsbucket = bscluster.openBucket(config.bucket, function( err ) {
        if(err) {
            console.log("Unable to connect to server");
            console.log(config);
            process.exit(1);
        }

        var bmanager = bsbucket.manager();
        // Update the beer view, to index beers `by_name`.
        bmanager.getDesignDocument( "proyecto", function( err, ddoc, meta ) {
            if(! ('by_type' in ddoc['views']) ) {
                ddoc.views.by_name = proyecto_by_type;
                bmanager.upsertDesignDocument( "proyecto", ddoc, function( err, res ) {
                    if(err) {
                        console.log( 'ERROR' + err );
                    } else if (res.ok) {
                        console.log( 'Updated ' + res.id );
                    }
                });
            } else {
              console.log('already setup');
              process.exit(0);
            }
        })
    })
}

exports.reset = function( config ) {
  var bscluster = new couchbase.Cluster(config.connstr);
  var bsbucket = bscluster.openBucket(config.bucket, function( err ) {
    if(err) {
      console.error("Failed to connect to cluster: " + err);
      process.exit(1);
    }
    var bmanager = bsbucket.manager();

    // Update the beer view, to index beers `by_name`.
    bmanager.getDesignDocument( "proyecto", function( err, ddoc, meta ) {
      console.log(err);
      console.log('get done');

      delete ddoc['views']['by_type'];
      bmanager.upsertDesignDocument( "proyecto", ddoc, function( err, res ) {
        console.log('set done');

        if(err) {
            console.log( 'ERROR' + err );
        } else if (res.ok) {
            console.log( 'Updated ' + res.id );
        }
      });
    })
  })
}
