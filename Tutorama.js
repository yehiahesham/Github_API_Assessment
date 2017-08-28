var  GitHub  = require ('github-api');
var http = require('http');

//initializing and declaring variables and the github-api
const gh = new GitHub();
let search = gh.search();
var today = new Date();
var past90 = new Date();
past90.setDate(today.getDate()-90); //calcu. the date from 90 days ago

function formatDate(date) { // converting to the required format of the github-api  query
    if(date instanceof Date && !isNaN(date.valueOf()))
    {
      var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }
  else {
    return console.error('not a date type !');
  }
}

function buildHtml(req,langs) { //creates HTML object to display the results in table
  var header = 'Top 100 most starred Repos created in the last 90 days ('+formatDate(past90)+ '...' + formatDate(today)+')';
  var style= '<style> table {font-family: arial, sans-serif;border-collapse: collapse;width: 100%;} td, th { border: 1px solid #dddddd; text-align: left; padding: 8px;} tr:nth-child(even) {  background-color: #dddddd; } </style>';
  var body = '<table>'+
  "<tr>"+
    "<th>language</th>"+
    "<th>repo_count</th>"+
    "<th>avg_stars_per_repo</th>"+
    "<th>avg_forks_per_repo</th>"+
  "</tr>";

  for (var l in langs) { // filling the table with the results
    body+='<tr><td>'+l+'</td>' +
    '<td>'+langs[l].repo_count+'</td>' +
    '<td>'+langs[l].avg_stars_per_repo+'</td>' +
    '<td>'+langs[l].avg_forks_per_repo+'</td> </tr>' ;
  }

  body+='</table>';

  return '<!DOCTYPE html>' // concatenate header, style, and body
       + '<html><header>' + header +style+ '</header><body>' + body + '</body></html>';
};

function getdata(cb){
  var langs= []; // json object to hold the resutls of the query.
  var options = { // options used in the query itself.
    q: 'created:' +formatDate(past90)+ '..' + formatDate(today),
    sort: 'stars',
    order: 'desc'
  };

  search.forRepositories(options).then((data)=>{ // using the github-api to search for repositories
      console.log('Received '+data['data'].length);
                for (var i = 0; i < 100; i++) // getting the Top 100 from the 1000
                 {
                   var lang = data['data'][i]['language'];
                   if(lang == null)  lang='language unknown'; //fixing the 'null' name to 'language unknown'
                   var idx=Object.keys(langs).indexOf(lang);
                   if(idx!= -1)
                        { // if the language was entered before
                          langs[lang]['repo_count']+=1,
                          langs[lang]['avg_stars_per_repo']+=data['data'][i]['stargazers_count'] ,
                          langs[lang]['avg_forks_per_repo']+=data['data'][i]['forks_count']
                        }
                        else
                        { // first time to see the language
                          langs[lang] =
                           {'repo_count':1,
                            'avg_stars_per_repo':data['data'][i]['stargazers_count'] ,
                            'avg_forks_per_repo':data['data'][i]['forks_count']
                            };
                        }
                  }

                  for (var l in langs) { // calcu the Avgs ...
                    langs[l].avg_stars_per_repo/=Math.round(langs[l].repo_count) ;
                    langs[l].avg_forks_per_repo/=Math.round(langs[l].repo_count) ;
                  }
                  cb(langs,null); // returing with the resulsts in a callback.
           }).catch((e)=>{//error handling logic
              return cb(null,e);
           });
}

console.log('Server Runing,  Go to http://localhost:8080/');
http.createServer(function (req, res) {
  console.log('Receiving Now Top 100 repositories ... ');
  getdata((langs,error)=>{ // try query the Top 100 repositories
              if(langs!= null && error==null )
             {
             console.log('Displaying Results');
             console.log('------------------------');
             var html = buildHtml(req,langs);
             res.writeHead(200, {
               'Content-Type': 'text/html',
               'Content-Length': html.length,
               'Expires': new Date().toUTCString()
             });
             res.end(html);
           }
           else { throw 'error happened, '+error; }
           });
}).listen(8080);
