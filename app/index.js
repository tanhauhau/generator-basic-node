var generators = require('yeoman-generator'),
         yosay = require('yosay'),
         chalk = require('chalk'),
         spawn = require('child_process').spawn,
            fs = require('fs'),
            path = require('path'),
            pad = require('left-pad'),
        Mustache = require('mustache'),
        license = require('license-generator');

module.exports = generators.Base.extend({
    constructor: function() {
        generators.Base.apply(this, arguments);

        this.on('end', function () {
            if (!this.options['skip-install']) {
                this.log(yosay(chalk.green.bold('I\'m all done. :)')));
            }
        });
    },
    initializing : function(){
        this.composeWith('travis', {}, {
            local: require.resolve('generator-travis')
        });
    },
    askFor: function(){
        var done = this.async();

        // Have Yeoman greet the user.
        this.log(yosay('Let\'s make some awesome node project!'));

        var prompts = [
            {
                type: 'input',
                name: 'name',
                message: 'name:',
                default: path.relative('..', process.cwd()),
            },
            {
                type: 'input',
                name: 'version',
                message: 'version:',
                default: '1.0.0',
                store: true
            },
            {
                type: 'input',
                name: 'description',
                message: 'description:'
            },
            {
                type: 'input',
                name: 'main',
                message: 'entry point:',
                default: 'index.js',
                store: true
            },
            {
                type: 'input',
                name: 'test',
                message: 'test command:'
            },
            {
                type: 'input',
                name: 'git',
                message: 'git repository:'
            },
            {
                type: 'input',
                name: 'keyword',
                message: 'keywords:'
            },
            {
                type: 'input',
                name: 'author',
                message: 'author:',
                store: true
            },
            {
                type: 'input',
                name: 'license',
                message: 'license:',
                default: 'ISC',
                store: true
            }
        ];
        this.prompt(prompts, function (response) {
            this.options.pkg = {};
            this.options.pkg.name = response.name;
            this.options.pkg.version = response.version;
            this.options.pkg.description = response.description;
            this.options.pkg.main = response.main;
            this.options.pkg.scripts = { test: (response.test !== '') ? response.test: 'echo "Error: no test specified" && exit 1' };
            if(response.git !== ''){
                this.options.pkg.repository = { type: 'git', url: response.git };
            }
            this.options.pkg.keywords = (response.keyword !== '') ? response.keyword.split(/[, ]+/): [];
            this.options.pkg.author = response.author;
            this.options.pkg.license = response.license;
            done();
        }.bind(this));
    },
    paths: function(){
        this.sourceRoot(path.join(__dirname, 'template/'));
    },
    app: function(){
        var pkg = this.options.pkg;

        //package json
        if(exists('package.json')){
            this.log(chalk.yellow(pad('overwrite', 9)) + ' package.json');
        }else{
            this.log(chalk.green(pad('create', 9)) + ' package.json');
        }
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 4), 'utf-8');

        //license
        if(exists('LICENSE')){
            this.log(chalk.yellow(pad('overwrite', 9)) + ' LICENSE');
        }else{
            this.log(chalk.green(pad('create', 9)) + ' LICENSE');
        }
        license.install({
            output: './LICENSE',
            license: pkg.license.toUpperCase(),
            year: (new Date()).getFullYear(),
            fullname: pkg.author,
            projectname: pkg.name,
        }, function(err){
            if(err) console.log(chalk.red(err));
        });

        //readme
        var readme = fs.readFileSync(path.resolve(__dirname, './template/README.md'), 'utf-8');
        var output = Mustache.render(readme, pkg);
        if(exists('README.md')){
            this.log(chalk.yellow(pad('overwrite', 9)) + ' README.md');
        }else{
            this.log(chalk.green(pad('create', 9)) + ' README.md');
        }
        fs.writeFileSync('README.md', output, 'utf-8');

        if(exists(pkg.main)){
        }else{
            this.log(chalk.green(pad('create', 9)) + ' ' + pkg.main);
            fs.closeSync(fs.openSync(pkg.main, 'w'));
        }

        //gitignore
        if(exists('.gitignore')){
            this.log(chalk.yellow(pad('overwrite', 9)) + ' .gitignore');
        }else{
            this.log(chalk.green(pad('create', 9)) + ' .gitignore');
        }
        fs.writeFileSync('.gitignore', 'node_modules', 'utf-8');

        if(pkg.repository !== undefined){
            //start git
            this.log(chalk.green(pad('init', 9)) + ' git');

            spawn('git', ['init'])
            .on('exit', function(){
                spawn('git', ['remote', 'add', 'origin', pkg.repository.url]);
            })
        }
    }
});

function exists(file){
    try{
        fs.statSync(file);
        return true;
    }catch(e){
        return false;
    }
}
