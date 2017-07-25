$(function() {
    var data = [
        {
            action: 'type',
            strings: ["wget https://github.com/rabix/bunny/releases/download/v1.0.1/rabix-1.0.1.tar.gz && tar -xvf rabix-1.0.1.tar.gz"],
            output: '<span class="gray">rabix installed</span><br>&nbsp;',
            postDelay: 1000
        },
        {
            action: 'type',
            strings: ["now lets run some example", ''],
            postDelay: 1000
        },
        {
            action: 'type',
            strings: ["./rabix examples/dna2protein/dna2protein.cwl.json examples/dna2protein/inputs.json"],
            output: '<span class="gray">example running</span><br>&nbsp;',
            postDelay: 500
        },
        {
            action: 'type',
            strings: ["that was easy! :)"],
            postDelay: 2000
        }

    ];
    runScripts(data, 0);
});

function runScripts(data, pos) {
    var prompt = $('.prompt'),
        script = data[pos];
    if(script.clear === true) {
        $('.history').html('');
    }
    switch(script.action) {
        case 'type':
            // cleanup for next execution
            prompt.removeData();
            $('.typed-cursor').text('');
            prompt.typed({
                strings: script.strings,
                typeSpeed: 10,
                callback: function() {
                    var history = $('.history').html();
                    history = history ? [history] : [];
                    history.push('$ ' + prompt.text());
                    if(script.output) {
                        history.push(script.output);
                        prompt.html('');
                        $('.history').html(history.join('<br>'));
                    }
                    // scroll to bottom of screen
                    $('section.terminal').scrollTop($('section.terminal').height());
                    // Run next script
                    pos++;
                    if(pos < data.length) {
                        setTimeout(function() {
                            runScripts(data, pos);
                        }, script.postDelay || 1000);
                    }
                }
            });
            break;
        case 'view':

            break;
    }
}

$('#year').append('<span>'+ new Date().getFullYear() +'</span>');