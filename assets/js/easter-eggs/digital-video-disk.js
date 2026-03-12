const section = document.querySelector('section');
const container = document.querySelector('.logo-container');
const logo = container.querySelector('.logo-dvd');
const FPS =60;

// Logo moving variables
let xPosition = 5;
let yPosition = 5;
let xSpeed = 4;
let ySpeed = 4;

function update(){
    logo.style.left = xPosition + 'px';
    logo.style.top = yPosition + 'px';
}

setInterval(()=>{
    if (xPosition + logo.clientWidth >= window.innerWidth || xPosition <= 0) {
        xSpeed = xSpeed*-1;
    }

    if (yPosition + logo.clientHeight >= window.innerHeight || yPosition <= 0) {
        ySpeed = ySpeed*-1;
    }
xPosition += xSpeed;
yPosition += ySpeed;

update();
}, 1000/FPS)

