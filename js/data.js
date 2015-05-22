//

(function(){
    var data = {
        fs:'varying highp vec4 vColor; \n  void main(void) { \n gl_FragColor = vColor;\n }\n',

        vs:'attribute vec3 aVertexPosition;\n attribute vec4 aVertexColor; \n uniform mat4 uMVMatrix; \n uniform mat4 uPMatrix; \n varying highp vec4 vColor; \n void main(void) {gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0); \n vColor = aVertexColor; \n}\n',

        fs_cube:'    precision mediump float;\n     varying vec2 vTextureCoord; \n     uniform sampler2D uSampler; \n     void main(void) { \n         gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, 1.0-vTextureCoord.t)); \n     }\n',

        vs_cube:'    attribute vec3 aVertexPosition; \n     attribute vec2 aTextureCoord; \n     uniform mat4 uMVMatrix; \n      uniform mat4 uPMatrix; \n     varying vec2 vTextureCoord;  \n     void main(void) {  \n          gl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);  \n          vTextureCoord = aTextureCoord;  \n     }\n'

        
    };

    
    var theData = {
        get_shader:function(name){
            if( name in data ){
                return data[name];

            }else{
                console.log(name + 'not exist.');
            }
        }
    };
    
    window.theData = theData;
})();
