let chain5 = {};

chain5.filterChain = [];
chain5.fileToChainIndex = {};
chain5.nextIndex = 0;

let chain5Context = this;

/*  Create a filter shader entirely during preload.
    Warning: Depends on hardcoded vertex shaders. 
    If these are changed in a future update of 
    p5.js, this will need to be updated too.    
    
    In:
        fragFilename: The path of the fragment shader.  */
chain5.loadFilter = function(fragFilename) {
    let defaultVertV1 = `
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        attribute vec3 aPosition;
        // texcoords only come from p5 to vertex shader
        // so pass texcoords on to the fragment shader in a varying variable
        attribute vec2 aTexCoord;
        varying vec2 vTexCoord;

        void main() {
        // transferring texcoords for the frag shader
        vTexCoord = aTexCoord;

        // copy position with a fourth coordinate for projection (1.0 is normal)
        vec4 positionVec4 = vec4(aPosition, 1.0);

        // project to 3D space
        gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;
        }
    `;
    let defaultVertV2 = `#version 300 es
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        in vec3 aPosition;
        in vec2 aTexCoord;
        out vec2 vTexCoord;

        void main() {
        // transferring texcoords for the frag shader
        vTexCoord = aTexCoord;

        // copy position with a fourth coordinate for projection (1.0 is normal)
        vec4 positionVec4 = vec4(aPosition, 1.0);

        // project to 3D space
        gl_Position = uProjectionMatrix * uModelViewMatrix * positionVec4;
        }
    `;
    const loadedShader = new p5.Shader();

    let loadedFrag = false;

    chain5Context.loadStrings(
        fragFilename,
        result => {
            let fragSrc = result.join('\n');
            let vertSrc = fragSrc.includes('#version 300 es') ? defaultVertV2 : defaultVertV1;
            loadedShader._vertSrc = vertSrc;
            loadedShader._fragSrc = fragSrc;
            loadedFrag = true;
        }
    );

    return loadedShader;
};


/*  Loads a bunch of filter shaders during
    preload to run in sequence.
    Depends on loadFilter.                  
    
    In: 
        filenames: List of shader paths         
    
    Out: 
        A p5.Shader                            */
chain5.loadFilterChain = function(filenames) {
    for (file of filenames) {
        chain5.filterChain.push(chain5.loadFilter(file));
        chain5.fileToChainIndex[file] = chain5.nextIndex;
        chain5.nextIndex += 1;
    }
}

/*  Set a filter's uniform from the filename                 
    
    In: 
        file: The path of the shader
        uniform: The name of the uniform
        value: The value that is being set      */
chain5.setFilterUniform = function(file, uniform, value) {
    chain5.filterChain[chain5.fileToChainIndex[file]].setUniform(uniform, value);
}

/*  Runs the currently loaded filter chain.     */
chain5.runFilterChain = function() {
    for (currFilter of chain5.filterChain) {
        filter(currFilter);
    }
}

