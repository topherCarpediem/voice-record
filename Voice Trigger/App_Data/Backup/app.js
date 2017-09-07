var record = document.querySelector('#record');
var stop = document.querySelector('#stop');
//var visualizer = document.querySelector('#visualizer');
var mainSection = document.querySelector('#main-controls');
var record_name = document.querySelector('#name');
//var play_audio = document.querySelector('#play');

var leftchannel = [];
var rightchannel = [];
var recorder = null;
var recording = false;
var recordingLength = 0;
var volume = null;
var audioInput = null;
var sampleRate = null;
var audioContext = null;
var context = null;

var audioCtx = new (window.AudioContext || webkitAudioContext)();
var canvasCtx = visualizer.getContext("2d");

stop.disabled = true;

var voice_record = {

    list: [],
    voice: {},
    id: 0,
    add: function (id, name, blob, url, file) {
        this.voice = { name: name, url: url, blob: blob, file: file };
        this.list.push(this.voice);
    },

    devare: function (id) {
        this.list.splice(id, 1);
    },
    play: function (id) {
        return this.list[id].url;
    }
}

var handlers = {

    createElements: function (id, _name, src) {

        var voiceContainer = document.querySelector(".voice");

        var audio = document.createElement("audio");
        var div = document.createElement("div");
        var name = document.createElement("p");
        var playButton = document.createElement("button");
        var devareButton = document.createElement("button");
        var uploadButton = document.createElement("button");

        name.textContent = _name;
        audio.id = "audio" + id;

        playButton.textContent = "Play";
        playButton.id = "play";
        playButton.value = id;

        devareButton.textContent = "Devare";
        devareButton.id = "devare";
        devareButton.value = id;

        uploadButton.textContent = "Upload";
        uploadButton.id = "upload";
        uploadButton.value = id;

        div.id = id;

        div.appendChild(audio);
        div.appendChild(name);
        div.appendChild(playButton);
        div.appendChild(devareButton);
        div.appendChild(uploadButton);

        voiceContainer.appendChild(div);

        //voice_record_view.displayRecords();
    },
    devareVoice: function (id) {
        voice_record.devare(id);
        voice_record_view.displayRecords();
    },
    playVoice: function (id) {
        var url = voice_record.play(id);
        audio = document.querySelector("#audio" + id);
        audio.src = url;
        audio.play();
    }

}

var voice_record_view = {
    displayRecords: function () {
        document.querySelector('.voice').innerHTML = '';

        if (voice_record.list.length != 0) {
            voice_record.list.forEach(function (voice, position) {
                handlers.createElements(position, voice.name, voice.url);
            });
        }
    },

    setUpEventListeners: function () {
        var voiceContainer = document.querySelector('.voice');
        var playButton = document.querySelector('#play');
        var devareButton = document.querySelector('#devare');
        var uploadButton = document.querySelector('#upload');

        voiceContainer.addEventListener('click', function (event) {

            if (event.target.id == 'play') {
                handlers.playVoice(event.target.value);
                //console.log("playbutton");

            } else if (event.target.id == 'devare') {
                //console.log(event.target.value);
                document.querySelector('.voice').innerHTML = '';
                handlers.devareVoice(event.target.value);
            } else if (event.target.id == 'upload') {
                console.log("uploadbutton");
                upload(voice_record.list[event.target.value].file, voice_record.list[event.target.value].name, event.target);
            }
        });


    }
}

var mic = {

    constraints: { audio: true },

    init: function () {

        if (navigator.getUserMedia) {

            console.log("supported")

            navigator.getUserMedia(this.constraints, success, function (e) {
                alert('Error capturing audio.');
            });


            record.onclick = function (e) {

                // reset the buffers for the new recording
                if (record_name.value != "") {
                    recording = true;
                    leftchannel.length = rightchannel.length = 0;
                    recordingLength = 0;
                    record.disabled = true;
                    stop.disabled = false;
                }
            }

            stop.onclick = function (e) {
                recording = false;
                record.disabled = false;
                stop.disabled = true;

                console.log('Building wav file...');

                // we flat the left and right channels down
                var leftBuffer = mergeBuffers(leftchannel, recordingLength);
                var rightBuffer = mergeBuffers(rightchannel, recordingLength);
                // we interleave both channels together
                var interleaved = interleave(leftBuffer, rightBuffer);

                // we create our wav file
                var buffer = new ArrayBuffer(44 + interleaved.length * 2);
                var view = new DataView(buffer);

                // RIFF chunk descriptor
                writeUTFBytes(view, 0, 'RIFF');
                view.setUint32(4, 44 + interleaved.length * 2, true);
                writeUTFBytes(view, 8, 'WAVE');
                // FMT sub-chunk
                writeUTFBytes(view, 12, 'fmt ');
                view.setUint32(16, 16, true);
                view.setUint16(20, 1, true);
                // stereo (2 channels)
                view.setUint16(22, 2, true);
                view.setUint32(24, sampleRate, true);
                view.setUint32(28, sampleRate * 4, true);
                view.setUint16(32, 4, true);
                view.setUint16(34, 16, true);
                // data sub-chunk
                writeUTFBytes(view, 36, 'data');
                view.setUint32(40, interleaved.length * 2, true);

                // write the PCM samples
                var lng = interleaved.length;
                var index = 44;
                var volume = 1;
                for (var i = 0; i < lng; i++) {
                    view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
                    index += 2;
                }

                // our final binary blob
                
                var name = record_name.value;
                var blob = new Blob([view], { type: 'audio/wav' });
                var file = new File([blob], name + "-" + (new Date).toISOString().replace(/:|\./g, '-') + ".wav", { type: "audio/wav" });
                var blobUrl = URL.createObjectURL(file);
                // var's save it locally

                document.querySelector('.voice').innerHTML = '';

                voice_record.add(voice_record.id++, name, blob, blobUrl, file);
                voice_record_view.displayRecords();
                console.log('Handing off the file now...');

            }

            function interleave(leftChannel, rightChannel) {
                var length = leftChannel.length + rightChannel.length;
                var result = new Float32Array(length);

                var inputIndex = 0;

                for (var index = 0; index < length;) {
                    result[index++] = leftChannel[inputIndex];
                    result[index++] = rightChannel[inputIndex];
                    inputIndex++;
                }
                return result;
            }

            function mergeBuffers(channelBuffer, recordingLength) {
                var result = new Float32Array(recordingLength);
                var offset = 0;
                var lng = channelBuffer.length;
                for (var i = 0; i < lng; i++) {
                    var buffer = channelBuffer[i];
                    result.set(buffer, offset);
                    offset += buffer.length;
                }
                return result;
            }

            function writeUTFBytes(view, offset, string) {
                var lng = string.length;
                for (var i = 0; i < lng; i++) {
                    view.setUint8(offset + i, string.charCodeAt(i));
                }
            }

            function success(e) {
                // creates the audio context
                audioContext = window.AudioContext || window.webkitAudioContext;
                context = new audioContext();

                // we query the context sample rate (varies depending on platforms)
                sampleRate = context.sampleRate;

                visuals.draw(e);

                // creates a gain node
                volume = context.createGain();

                // creates an audio node from the microphone incoming stream
                audioInput = context.createMediaStreamSource(e);

                // connect the stream to the gain node
                audioInput.connect(volume);

                /* From the spec: This value controls how frequently the audioprocess event is 
                dispatched and how many sample-frames need to be processed each call. 
                Lower values for buffer size will result in a lower (better) latency. 
                Higher values will be necessary to avoid audio breakup and glitches */
                var bufferSize = 2048;
                recorder = context.createScriptProcessor(bufferSize, 2, 2);

                recorder.onaudioprocess = function (e) {
                    if (!recording) return;
                    var left = e.inputBuffer.getChannelData(0);
                    var right = e.inputBuffer.getChannelData(1);
                    // we clone the samples
                    leftchannel.push(new Float32Array(left));
                    rightchannel.push(new Float32Array(right));
                    recordingLength += bufferSize;
                    console.log('recording');
                }

                // we connect the recorder
                volume.connect(recorder);
                recorder.connect(context.destination);
            }
        } else {
            alert('Get the latest version of chrome or mozilla firefox');
        }
    }

}


var visuals = {

    draw: function (stream) {
        //console.log(stream);
        var source = audioCtx.createMediaStreamSource(stream);
        var analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        var bufferLength = analyser.frequencyBinCount;
        var dataArray = new Uint8Array(bufferLength);

        source.connect(analyser);

        canvas_draw();

        function canvas_draw() {
            WIDTH = visualizer.width
            HEIGHT = visualizer.height;

            requestAnimationFrame(canvas_draw);

            analyser.getByteTimeDomainData(dataArray);

            canvasCtx.fillStyle = 'rgb(255, 255, 255)';
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

            canvasCtx.beginPath();

            var sliceWidth = WIDTH * 1.0 / bufferLength;
            var x = 0;


            for (var i = 0; i < bufferLength; i++) {

                var v = dataArray[i] / 128.0;
                var y = v * HEIGHT / 2;

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.lineTo(visualizer.width, visualizer.height / 2);
            canvasCtx.stroke();
        }
    }

}

window.onresize = function () {
    visualizer.width = mainSection.offsetWidth;
}

window.onresize();
mic.init();
voice_record_view.setUpEventListeners();


function upload(file, word, target) {

    var formData = new FormData();
    formData.append('file', file);
    formData.append('word_name', word);
    formData.append('location', null);
    formData.append('gender', null);
    formData.append('age', null);

    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState == 4 && request.status == 200) {

            

            //response
            console.log(request.response);
        }
    };

    request.addEventListener("progress", function (e) {
        var pc = parseInt(e.loaded / e.total) * 100;
        target.disabled = true;
        target.textContent = 'Uploading....' + pc;
        // console.log(e);
        if (pc == 100) {
            setTimeout(function () { handlers.devareVoice(target.id); }, 1500);
            
        }
    });

    request.open('POST', 'home/upload');
    request.send(formData);
}


function getName() {

    var formData = new FormData();
    formData.append('name', document.querySelector("#name").value);


    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (request.readyState == 4 && request.status == 200) {

            //response
            console.log(request.response);
            //var play = document.querySelector("#retrieve");
            //var audio = document.querySelector(".re");

            //play.onclick = function (e) {
                //var bloburl = URL.createObjectURL(request.response);
                //audio.src = bloburl;
                //audio.play();
            //}


        }
    };
    
    request.open('POST', 'home/getfile');
    request.send(formData);
}


