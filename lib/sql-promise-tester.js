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
                //console.log('before',opts.connOpts||defaultConnOpts);
                sqlPromise.connect(opts.connOpts||defaultConnOpts).then(function(obtainedConn){
                    conn=obtainedConn;
                }).then(done,done);
            });
            after(function(done){
                conn.done();
                done();
            });
            it('must create table',function(done){
                conn.query("CREATE TABLE example1(id_num integer primary key, datum text)").then(function(query){
                    expect(query.fetchAll).to.be.a(Function);
                    return query.fetchAll();
                }).then(function(result){
                    //console.log('result',result);
                }).then(done,done);
            });
            var data=[
                {id_num:1, datum:'one'},
                {id_num:2, datum:'two'},
                {id_num:3, datum:'three'},
                {id_num:6, datum:'six'}
            ];
            data.forEach(function(data1){
                it('must insert data '+JSON.stringify(data1),function(done){
                    var cursor=conn.query(
                        "INSERT INTO example1 VALUES ("+conn.placeHolder(1)+","+conn.placeHolder(2)+" )", 
                        [data1.id_num, data1.datum]
                    ).fetchAll().then(function(result){
                        //console.log('result',result);
                        expect(result.rowCount).to.be(1);
                    }).then(done,done);
                });
            });
            if(opts.testUntil=='select'){
                return;
            }
            it('must select data',function(done){
                var cursor=conn.query(
                    "SELECT * FROM example1"
                ).fetchAll().then(function(result){
                    expect(result.rows).to.eql(data);
                }).then(done,done);
            });
            it.skip('must return field info even without data',function(done){
                var cursor=conn.query(
                    "SELECT * FROM example1 where id_num<0"
                ).fetchAll().then(function(result){
                    expect(result.rowCount).to.be(0);
                    expect(result.fields).to.be(['very large plus pver ;as ']);
                }).then(done,done);
            });
            it('must select data row by row',function(done){
                var acumulateData=[];
                var cursor=conn.query(
                    "SELECT * FROM example1"
                ).fetchRowByRow(function(row){
                    acumulateData.push(row);
                }).then(function(){
                    expect(acumulateData).to.eql(data);
                }).then(done,done);
            });
            function testLimitedFetch(methodName, expectedValue, mustHaveRows, done) {
                var re = new RegExp('ERROR sql-promise.'+methodName);
                it(methodName+': must fail if multiple data is received',function(done){
                    var cursor=conn.query(
                        "SELECT * FROM example1"
                    )[methodName]().then(function(result){
                        done(Error('must fail, it haves more than one row'));
                    },function(err){
                        expect(err.notUnique).to.ok();
                        expect(err.message).to.match(re);
                        done();
                    }).catch(done);
                });
                if(mustHaveRows) {
                    it(methodName+': must fail if multiple data when called with no rows',function(done){
                        var cursor=conn.query(
                            "SELECT * FROM example1 where 0<0"
                        )[methodName]().then(function(result){
                            done(Error('must fail, it haves rows'));
                        },function(err){
                            expect(err.message).to.match(re);
                            done();
                        }).catch(done);
                    });
                } else {
                    it(methodName+': must not fail if no data is received',function(done){
                        var cursor=conn.query(
                            "SELECT * FROM example1 where 0<0"
                        )[methodName]().then(function(result){
                            expect(result.rowCount).to.be(0);
                            done();
                        },function(err){
                            done('must not fail if there are no results');
                        }).catch(done);
                    });
                }
                it(methodName+': must select data',function(done){
                    var cursor=conn.query(
                        "SELECT datum FROM example1 WHERE id_num=3"
                    )[methodName]().then(function(result){
                        expect(result).to.eql(expectedValue);
                        done();
                    },function(err){
                        done(Error(err));
                    }).catch(done);
                });                
            }
        testLimitedFetch('fetchUniqueRow', {row:{ datum: 'three'}}, true, done);
            testLimitedFetch('fetchUniqueValue', {value:'three'}, true, done);
            testLimitedFetch('fetchOneRowIfExists', {row: {datum: 'three'}, rowCount:1}, false, done);
        });
    });
};

module.exports = sqlPromiseTester;