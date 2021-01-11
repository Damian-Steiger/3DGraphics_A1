
var canvas;
var gl;

var program;

var near = -100;
var far = 100;


var left = -6.0;
var right = 6.0;
var ytop = 6.0;
var bottom = -6.0;


var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0);
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0);

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(0.4, 0.4, 0.4, 1.0);
var materialShininess = 30.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var RB = 0;
var prevTime = 0.0;
var resetTimerFlag = true;
var animFlag = true;
var controller;

function setColor(c) {
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(program,
        "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
        "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
        "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
        "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program,
        "shininess"), materialShininess);
}

window.onload = function init() {

    canvas = document.getElementById("gl-canvas");

    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) { alert("WebGL isn't available"); }

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.5, 0.5, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);


    setColor(materialDiffuse);

    Cube.init(program);
    Cylinder.init(9, program);
    Cone.init(9, program);
    Sphere.init(36, program);


    modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");


    gl.uniform4fv(gl.getUniformLocation(program,
        "ambientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
        "diffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
        "specularProduct"), flatten(specularProduct));
    gl.uniform4fv(gl.getUniformLocation(program,
        "lightPosition"), flatten(lightPosition));
    gl.uniform1f(gl.getUniformLocation(program,
        "shininess"), materialShininess);


    render();
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix, modelMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    normalMatrix = inverseTranspose(modelViewMatrix);
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix));
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    setMV();

}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
function drawCube() {
    setMV();
    Cube.draw();
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawSphere() {
    setMV();
    Sphere.draw();
}
// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
function drawCylinder() {
    setMV();
    Cylinder.draw();
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawCone() {
    setMV();
    Cone.draw();
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modeling matrix with the result
function gTranslate(x, y, z) {
    modelMatrix = mult(modelMatrix, translate([x, y, z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modeling matrix with the result
function gRotate(theta, x, y, z) {
    modelMatrix = mult(modelMatrix, rotate(theta, [x, y, z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modeling matrix with the result
function gScale(sx, sy, sz) {
    modelMatrix = mult(modelMatrix, scale(sx, sy, sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop();
}

// pushes the current modelViewMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix);
}

//generates a random number between 4 and 5 to determine how many bubbles to draw
function randomBubble() {
    RB = Math.floor(Math.random() * (5 - 4 + 1)) + 4;
}

//call of random bubble generator
randomBubble();

//sets the location, color, scale, and rotation of the components of seaweed
function seaweedHelper(s1,s2,s3){
    gPush();
    {
        setColor(vec4(0.0, 1.0, 0.0, 1.0));
        gScale(s1, s2, s3); //scales down a sphere for seaweed component
        drawSphere()
    }
    gPop();

    gTranslate(0, .4, 0);
    gRotate(5 * (Math.cos(TIME)), 0, 0, 1);
}

seaweedHelper(1/8,1/4,1/4);

//hands scale data to seaweed helper to draw seaweed components. also undoes the translation as to reset the frame
function seaweed(u, v) {
    gTranslate(-u, -v, 0);
    gRotate(5 * (Math.cos(TIME)), 0, 0, 1);

    seaweedHelper(1/8,1/4,1/4); //1
    seaweedHelper(1/8,1/4,1/4); //2
    seaweedHelper(1/8,1/4,1/4); //3
    seaweedHelper(1/8,1/4,1/4); //4
    seaweedHelper(1/8,1/4,1/4); //5
    seaweedHelper(1/8,1/4,1/4); //6
    seaweedHelper(1/8,1/4,1/4); //7
    seaweedHelper(1/8,1/4,1/4); //8
    seaweedHelper(1/8,1/4,1/4); //9
    seaweedHelper(1/8,1/4,1/4); //10

    for (var i = 0; i < 10; i++) {
        gRotate(-5 * (Math.cos(TIME)), 0, 0, 1); //undoes rotation frame fromm seaweed components
        gTranslate(0, -.4, 0); //undoes rotation frame fromm seaweed components
    }

    gRotate(-5 * (Math.cos(TIME)), 0, 0, 1); //undoes rotation frame fromm seaweed components
    gTranslate(u, v, 0); //undoes rotation frame fromm seaweed components
}

//takes location and scale to draw a rock
function rock(x, y, z, u) {
    gPush();
    {
        setColor(vec4(0.4, 0.4, 0.4, 1.0));
        gTranslate(x, y, z); //moves rock to proper location
        gScale(u, u, u); //scales rock
        drawSphere()
    }
    gPop();
}

//draws a bubble using sin scaling, given location, time to appear, and scaling factors
function bubble(x, y, t, r1, r2) {
    gPush();
    {
        setColor(vec4(1.0, 1.0, 1.0, 1.0));
        gTranslate(x + Math.sin(TIME) / 2, y + Math.sin(TIME) / 3, 1 / 2); // moves bubbles to figure head
        gTranslate(-Math.sin(TIME) / 2, -Math.sin(TIME) / 3, 1 / 2); //undoes movement once bubble is at head location (bubble doesnt move with figure)
        gTranslate(0, TIME, 0); // move bubble up with time
        gScale((Math.sin(TIME * r1) + 2) * 1 / 10, (Math.sin(TIME * r2) + 2) * 1 / 10, 1); //scales bubble's x and y with sin
        if (TIME > t) {
            drawSphere()
        }
    }
    gPop();
}

//draws a bubble using cos scaling, given location, time to appear, and scaling factors
function bubble2(x, y, t, r1, r2) {
    gPush();
    {
        setColor(vec4(1.0, 1.0, 1.0, 1.0));
        gTranslate(x + Math.sin(TIME) / 2, y + Math.sin(TIME) / 3, 1 / 2); // moves bubbles to figure head
        gTranslate(-Math.sin(TIME) / 2, -Math.sin(TIME) / 3, 1 / 2);//undoes movement once bubble is at head location (bubble doesnt move with figure)
        gTranslate(0, TIME, 0); // move bubble up with time
        gScale((Math.cos(TIME * r1) + 2) * 1 / 10, (Math.cos(TIME * r2) + 2) * 1 / 10, 1);//scales bubble's x and y with cos
        if (TIME > t) {
            drawSphere()
        }
    }
    gPop();
}

//main render function
function render() {

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    eye = vec3(0, 0, 10);
    MS = []; // Initialize modeling matrix stack

    // initialize the modeling matrix to identity
    modelMatrix = mat4();

    // set the camera matrix
    viewMatrix = lookAt(eye, at, up);

    // set the projection matrix
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    // Rotations from the sliders
    gRotate(RZ, 0, 0, 1);
    gRotate(RY, 0, 1, 0);
    gRotate(RX, 1, 0, 0);


    // set all the matrices
    setAllMatrices();

    var curTime;
    if (animFlag) {
        curTime = (new Date()).getTime() / 1000;
        if (resetTimerFlag) {
            prevTime = curTime;
            resetTimerFlag = false;
        }
        TIME = TIME + curTime - prevTime;
        prevTime = curTime;
    }

    if (TIME > 12.55) TIME = 0, randomBubble();

    /////////////////////////////////bubbles////////////////////////////////////
    bubble(4, 4, 0, 1.3, .9); //b1
    bubble2(4.1, 3.5, .5, 1.2, .8); //b2
    bubble(4.3, 3.1, 1, 2, 1.4); //b3
    bubble2(4.4, 2.6, 1.5, 1.8, 1.7); //b4
    bubble(4.5, 2.7, 1.5, 2, 2); //b5
    bubble2(3.8, -1.8, 5.5, 1.5, 2); //b6
    bubble(4, -2.2, 6, 1.3, .9); //b7
    bubble2(4.1, -2.4, 6.5, 2, 1.4); //b8
    bubble(4.2, -2.8, 7, 1.8, 1.7); //b9
    bubble2(4.4, -3, 7.5, 2, 2); //b10

    /////////////////////////////////Groundbox/////////////////////////////////
    gPush();
    {
        setColor(vec4(0.3, 0.3, 0.3, 1.0));
        gTranslate(0, -12, 0); //moves down groundbox
        gScale(8, 8, 8); //makes groundbox bigger
        gRotate(8, 1, 0, 0); //slightly rotates groundbox
        drawCube()
    }
    gPop();

    /////////////////////////////////Swimmer/////////////////////////////////
    gPush(); //head
    {
        setColor(vec4(0.7, 0.0, 0.9, 1.0));
        gTranslate(4 + Math.sin(TIME) / 2, 4 + Math.sin(TIME) / 3, 0); //move head to figure location, and oscilate
        gRotate(-20, 0, 1, 0);
        gScale(1 / 2, 1 / 2, 1 / 2);
        drawSphere()
    }
    gPop();

    gPush(); //body
    {
        setColor(vec4(0.7, 0.0, 0.9, 1.0));
        gTranslate(0, -3 / 2, 0);
        gTranslate(4 + Math.sin(TIME) / 2, 4 + Math.sin(TIME) / 3, 0);//move body to figure location, and oscilate
        gRotate(-20, 0, 1, 0);
        gScale(2 / 3, 1, 2 / 3);
        drawCube()
        gScale(3 / 2, 1, 3 / 2);
    }
    gPop();

    gPush(); //leg (left)
    {
        setColor(vec4(0.7, 0.0, 0.9, 1.0));
        gTranslate(1 / 3, -3, 1 / 3);
        gTranslate(4 + Math.sin(TIME) / 2, 4 + Math.sin(TIME) / 3, 0);//move left leg to figure location, and oscilate
        gRotate(15 * (Math.cos(TIME) + 1), 1, 0, 0);//rotate thigh
        gTranslate(0, 0, -(Math.cos(TIME) + 1) / 10);
        gRotate(-20, 0, 1, 0);
        gScale(1 / 5, 1 / 2, 1 / 5);
        drawCube()
        gScale(5, 2, 5);
    }

    gPush(); //shin (left)
    {
        setColor(vec4(0.8, 0.4, 0.9, 1.0));
        gTranslate(0, -1, 0);
        gRotate(15 * (Math.cos(TIME) + 1), 1, 0, 0);//rotate shin
        gTranslate(0, (Math.cos(TIME) + 1) / 10, -(Math.cos(TIME) + 1) / 5);
        gScale(1 / 5, 1 / 2, 1 / 5);
        drawCube()
        gScale(5, 2, 5);

    }

    gPush(); //foot (left)
    {
        setColor(vec4(0.0, 0.4, 0.9, 1.0));
        gTranslate(0, -.7, .1);
        gScale(1 / 5, 1 / 5, 1 / 3);//move foot to bottom of shin
        drawCube()
    }
    gPop();
    gPop();
    gPop();

    gPush(); //leg (right)
    {
        setColor(vec4(0.7, 0.0, 0.9, 1.0));
        gTranslate(-1 / 3, -3, 1 / 3);
        gTranslate(4 + Math.sin(TIME) / 2, 4 + Math.sin(TIME) / 3, 0);//move right leg to figure location, and oscilate
        gRotate(15 * (Math.sin(TIME) + 1), 1, 0, 0);//rotate thigh
        gTranslate(0, 0, -(Math.sin(TIME) + 1) / 10);
        gRotate(-20, 0, 1, 0);
        gScale(1 / 5, 1 / 2, 1 / 5);
        drawCube()
        gScale(5, 2, 5);
    }

    gPush(); //shin (right)
    {
        setColor(vec4(0.8, 0.4, 0.9, 1.0));
        gTranslate(0, -1, 0);
        gRotate(15 * (Math.sin(TIME) + 1), 1, 0, 0);
        gTranslate(0, (Math.sin(TIME) + 1) / 10, -(Math.sin(TIME) + 1) / 5);//rotate shin
        gScale(1 / 5, 1 / 2, 1 / 5);
        drawCube()
        gScale(5, 2, 5);

    }

    gPush(); //foot (right)
    {
        setColor(vec4(0.0, 0.4, 0.9, 1.0));
        gTranslate(0, -.7, .1); //move foot to bottom of shin
        gScale(1 / 5, 1 / 5, 1 / 3);
        drawCube()
    }
    gPop();
    gPop();
    gPop();

    /////////////////////////////////Fish/////////////////////////////////
    gPush(); //head
    {
        setColor(vec4(0.0, 0.0, 1.0, 1.0));
        gTranslate(-2, 0, 0);
        gRotate(TIME * 180 / 3.14159, 0, -1, 0); //rotate fish around seaweed
        gTranslate(2, 0, 0);
        gTranslate(1, Math.sin(TIME), 0);
        drawCone()
    }
    gPop();

    gPush(); //body
    {
        setColor(vec4(0.0, 1.0, 0.0, 1.0));
        gTranslate(-2, 0, 0);
        gRotate(TIME * 180 / 3.14159, 0, -1, 0);//rotate fish around seaweed
        gTranslate(2, 0, 0);
        gTranslate(1, Math.sin(TIME), -2);
        gRotate(180, 0, 1, 0);
        gScale(1, 1, 3);
        drawCone()
    }
    gPop();

    gPush(); //tail uppper part
    {
        setColor(vec4(1.0, 0.0, 0.0, 1.0));
        gTranslate(-2, 0, 0);
        gRotate(TIME * 180 / 3.14159, 0, -1, 0);//rotate fish around seaweed
        gTranslate(2, 0, 0);
        gTranslate(1, 4 / 9 + Math.sin(TIME), -7 / 2);
        gRotate(-90, 1, 0, 0);
        gRotate(-30, 1, 0, 0);
        gTranslate(Math.sin(TIME * 5) / 4, 0, 0);
        gRotate(180 / 3.14159 * Math.sin(TIME * 5), 0, 1, 0);
        gTranslate(Math.sin(TIME * 5) / 4, 0, 0);
        gScale(1 / 4, 1 / 4, 1);
        drawCone()
    }
    gPop();

    gPush(); //tail lower part
    {
        setColor(vec4(1.0, 0.0, 0.0, 1.0));
        gTranslate(-2, 0, 0);
        gRotate(TIME * 180 / 3.14159, 0, -1, 0);
        gTranslate(2, 0, 0);
        gTranslate(1, -4 / 9 + Math.sin(TIME), -7 / 2);//rotate fish around seaweed
        gRotate(90, 1, 0, 0);
        gRotate(30, 1, 0, 0);
        gTranslate(Math.sin(TIME * 5) / 4, 0, 0);
        gRotate(180 / 3.14159 * Math.sin(TIME * 5), 0, 1, 0);//spin tail
        gTranslate(Math.sin(TIME * 5) / 4, 0, 0);
        gScale(1 / 4, 1 / 4, 2 / 3);
        drawCone()
    }
    gPop();

    gPush(); //eye left
    {
        setColor(vec4(1.0, 1.0, 1.0, 1.0));
        gTranslate(-2, 0, 0);
        gRotate(TIME * 180 / 3.14159, 0, -1, 0);//rotate fish around seaweed
        gTranslate(2, 0, 0);
        gTranslate(3 / 2, 1 / 2 + Math.sin(TIME), 0); //spin tail
        gScale(1 / 5, 1 / 5, 1 / 5);
        drawSphere()
    }
    gPop();

    gPush(); //eye right
    {
        setColor(vec4(1.0, 1.0, 1.0, 1.0));
        gTranslate(-2, 0, 0);
        gRotate(TIME * 180 / 3.14159, 0, -1, 0);//rotate fish around seaweed
        gTranslate(2, 0, 0);
        gTranslate(1 / 2, 1 / 2 + Math.sin(TIME), 0);
        gScale(1 / 5, 1 / 5, 1 / 5);
        drawSphere()
    }
    gPop();

    gPush(); //black of eye left
    {
        setColor(vec4(0.0, 0.0, 0.0, 1.0));
        gTranslate(-2, 0, 0);
        gRotate(TIME * 180 / 3.14159, 0, -1, 0);//rotate fish around seaweed
        gTranslate(2, 0, 0);
        gTranslate(3 / 2, 1 / 2 + Math.sin(TIME), 1 / 5);
        gScale(1 / 10, 1 / 10, 1 / 10);
        drawSphere()
    }
    gPop();

    gPush(); //black of eye right
    {
        setColor(vec4(0.0, 0.0, 0.0, 1.0));
        gTranslate(-2, 0, 0);
        gRotate(TIME * 180 / 3.14159, 0, -1, 0);//rotate fish around seaweed
        gTranslate(2, 0, 0);
        gTranslate(1 / 2, 1 / 2 + Math.sin(TIME), 1 / 5);
        gScale(1 / 10, 1 / 10, 1 / 10);
        drawSphere()
    }
    gPop();

    /////////////////////////////////Rocks/////////////////////////////////
    //big rock
    rock(-2, -3, 0, 1);
    //small rock
    rock(-3.4, -3.4, 0, 1 / 2);

    /////////////////////////////////Seaweed/////////////////////////////////
    seaweed(2, 1.8);
    seaweed(3.1, 2.8);
    seaweed(1.1, 2.5);

    if (animFlag)
        window.requestAnimFrame(render);
}

// A simple camera controller which uses an HTML element as the event
// source for constructing a view matrix. Assign an "onchange"
// function to the controller as follows to receive the updated X and
// Y angles for the camera:
//
//   var controller = new CameraController(canvas);
//   controller.onchange = function(xRot, yRot) { ... };
//
// The view matrix is computed elsewhere.
function CameraController(element) {
    var controller = this;
    this.onchange = null;
    this.xRot = 0;
    this.yRot = 0;
    this.scaleFactor = 3.0;
    this.dragging = false;
    this.curX = 0;
    this.curY = 0;

    // Assign a mouse down handler to the HTML element.
    element.onmousedown = function (ev) {
        controller.dragging = true;
        controller.curX = ev.clientX;
        controller.curY = ev.clientY;
    };

    // Assign a mouse up handler to the HTML element.
    element.onmouseup = function (ev) {
        controller.dragging = false;
    };

    // Assign a mouse move handler to the HTML element.
    element.onmousemove = function (ev) {
        if (controller.dragging) {
            // Determine how far we have moved since the last mouse move
            // event.
            var curX = ev.clientX;
            var curY = ev.clientY;
            var deltaX = (controller.curX - curX) / controller.scaleFactor;
            var deltaY = (controller.curY - curY) / controller.scaleFactor;
            controller.curX = curX;
            controller.curY = curY;
            // Update the X and Y rotation angles based on the mouse motion.
            controller.yRot = (controller.yRot + deltaX) % 360;
            controller.xRot = (controller.xRot + deltaY);
            // Clamp the X rotation to prevent the camera from going upside
            // down.
            if (controller.xRot < -90) {
                controller.xRot = -90;
            } else if (controller.xRot > 90) {
                controller.xRot = 90;
            }
            // Send the onchange event to any listener.
            if (controller.onchange != null) {
                controller.onchange(controller.xRot, controller.yRot);
            }
        }
    };
}
