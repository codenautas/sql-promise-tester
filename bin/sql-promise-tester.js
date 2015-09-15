"use strict";
/*jshint eqnull:true */
/*jshint globalstrict:true */
/*jshint node:true */

var sqlPromiseTester = {};

var expect = require('expect.js');

var sqlPromise = require('sql-promise');

sqlPromiseTester = function(motor, opts){
    var defaultConnOpts={
        motor: 'test',
        user:'test_user',
        password:'test_pass',
        database:'test_db',
        host:'localhost',
        port:motor.defaultPort
    };
    describe('sql-promise-tester '+motor.motorName, function(){
        before(function(done){
            if(opts.prepare){
                opts.prepare().then(function(){
                    sqlPromise.register('test', motor);
                }).then(done,done);
            }else{
                done();
            }
        });
        it('must provide defaultPort', function(){
            expect('defaultPort' in motor).to.be.ok();
        });
        it('connect', function(done){
            sqlPromise.connect(opts.connOpts||defaultConnOpts).then(function(connection){
                connection.done();
                done();
            }).catch(done);
        });
        it('not connect with bad connection parameters', function(done){
            sqlPromise.connect(opts.badConnOpts||{
                user:'test_user',
                password:'BAD PASS',
                database:'test_db',
                host:'localhost',
                port:motor.defaultPort
            }).then(function(){
                done(new Error('must not connect'));
            }).catch(function(err){
                done();
            });
        });
        if(opts.testUntil=='connect'){
            return;
        }
        describe('connectected tests', function(done){
            var conn;
            before(function(done){
                console.log('before',opts.connOpts||defaultConnOpts);
                sqlPromise.connect(opts.connOpts||defaultConnOpts).then(function(obtainedConn){
                    console.log('ok connect');
                    conn=obtainedConn;
                    console.log('ok connect2');
                    done();
                    console.log('ok connect3');
                }).catch(done);
            });
            after(function(done){
                console.log('after 1');
                conn.done();
                console.log('after 2');
                done();
            });
            it('must create table',function(done){
                console.log('must 1');
                conn.query("CREATE TABLE example1(id integer primary key, datum text)").then(function(query){
                    console.log('must 2');
                    expect(query.fetchAll).to.be.a(Function);
                    console.log('must 3');
                    return query.fetchAll();
                }).then(function(result){
                    console.log('must 4');
                    console.log('result',result);
                    console.log('must 5');
                    done();
                }).catch(done);
            });
            it('must insert data',function(done){
                var cursor=conn.query(
                    "INSERT INTO example1 VALUES (1, 'one')"
                // MAS ADELANTE ESTA SINTAXIS: ).execute().then(function(result){
                ).then(function(query){
                    return query.fetchAll();
                }).then(function(result){
                    console.log('result',result);
                    expect(result.rowCount).to.be(1);
                    done();
                }).catch(done);
            });
            it('must select data',function(done){
                var cursor=conn.query(
                    "SELECT * FROM example1"
                // MAS ADELANTE ESTA SINTAXIS: ).fetchAll().then(function(result){
                ).then(function(query){
                    return query.fetchAll();
                }).then(function(result){
                    console.log('result',result);
                    expect(result.rows).to.eql([{id:1, datum:'one'}]);
                    done();
                }).catch(done);
            });
        });
    });
};

module.exports = sqlPromiseTester;