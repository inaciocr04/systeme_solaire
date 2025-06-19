import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import WebGL from "three/examples/jsm/capabilities/WebGL.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { CSVToArray, latLonToVector3 } from "/src/modules/utils.mjs";

if (!WebGL.isWebGL2Available()) {
  const warning = WebGL.getWebGL2ErrorMessage();
  document.getElementById("container").appendChild(warning);
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
const container = document.getElementById("container");
renderer.setSize(
  container.clientWidth,
  container.clientHeight 
);

container.appendChild(renderer.domElement);

renderer.setClearColor(0x000000, 1.0);
renderer.clear();

const fov = 45;
const aspect = window.innerWidth / window.innerHeight;
const near = 1;
const far = 1000;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

camera.position.set(30, 2, 60);

camera.up = new THREE.Vector3(0, 1, 0);

camera.lookAt(0, 0, 0);

const scene = new THREE.Scene();

const loader = new THREE.TextureLoader();

loader.load(
  "/src/img/starry_background.jpg",
  function (texture) {
    scene.background = texture;
  },

  undefined
);

// Création de la sphère "earth"
const geometry = new THREE.SphereGeometry(15, 60, 60);

// Création du chargeur de textures
const textureLoader = new THREE.TextureLoader();

// Chargement des textures de la Terre
const colorMap = textureLoader.load("/src/img/earthmap4k.jpg");
const specularMap = textureLoader.load("/src/img/earthspec4k.jpg");
const normalMap = textureLoader.load("/src/img/earth_normalmap_flat4k.jpg");
const cloudMap = textureLoader.load("/src/img/fair_clouds_4k.png");

const material = new THREE.MeshPhongMaterial({
  map: colorMap,
  specularMap: specularMap,
  normalMap: normalMap,
  shininess: 30,
  specular: new THREE.Color(0x555555),
});

const earth = new THREE.Mesh(geometry, material);
earth.name = "earth";
scene.add(earth);

const moonGeometry = new THREE.SphereGeometry(4.08, 32, 32);
const moonMap = textureLoader.load("/src/img/moonmap4k.jpg");
const moonNormalMap = textureLoader.load("/src/img/moonbump4k.jpg");

const moonMaterial = new THREE.MeshPhongMaterial({
  map: moonMap,
  moonNormalMap: moonNormalMap,
});

const moon = new THREE.Mesh(moonGeometry, moonMaterial);
moon.name = "moon";
moon.position.set(20, 0, 0);
scene.add(moon);

const moonPivot = new THREE.Group();
scene.add(moonPivot);
moonPivot.add(moon);

const cloudGeometry = new THREE.SphereGeometry(15.1, 60, 60);

const cloudMaterial = new THREE.MeshPhongMaterial({
  map: cloudMap,
  transparent: true,
  depthWrite: false,
  opacity: 1.0,
  side: THREE.DoubleSide,
});

const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
clouds.name = "clouds";
scene.add(clouds);

// Lumière ambiante
const ambientLight = new THREE.AmbientLight(0x3f3f3f);
scene.add(ambientLight);

// Lumière directionnelle
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(200, 10, 100);
scene.add(directionalLight);

renderer.render(scene, camera);

window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
  console.log("resize");
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
}

const controls = new OrbitControls(camera, renderer.domElement);

const controlParams = {
  rotationSpeed: 0.001,
  rotationSpeedMoon: 0.01,
  ambientLightColor: ambientLight.color.getHex(),
  directionalLightX: directionalLight.position.x,
  directionalLightY: directionalLight.position.y,
  directionalLightZ: directionalLight.position.z,
  animation: true,
  moon: true,
};

const gui = new GUI();
gui
  .add(controlParams, "rotationSpeed")
  .name("Rotation speed Earth")
  .min(0)
  .max(0.01)
  .step(0.0001);
gui
  .add(controlParams, "rotationSpeedMoon")
  .name("Rotation speed Moon")
  .min(0)
  .max(0.08)
  .step(0.001);
gui
  .addColor(controlParams, "ambientLightColor")
  .name("Ambient color")
  .onChange((value) => {
    ambientLight.color.set(value);
  });
gui
  .add(controlParams, "directionalLightX", -200, 200)
  .name("Light X")
  .onChange((value) => {
    directionalLight.position.x = value;
  });
gui
  .add(controlParams, "directionalLightY", -200, 200)
  .name("Light Y")
  .onChange((value) => {
    directionalLight.position.y = value;
  });
gui
  .add(controlParams, "directionalLightZ", -200, 200)
  .name("Light Z")
  .onChange((value) => {
    directionalLight.position.z = value;
  });
gui.add(controlParams, "animation").name("Animation");

gui
  .add(controlParams, "moon")
  .name("Afficher la Lune")
  .onChange((value) => {
    moon.visible = value;
  });
const stats = new Stats();
document.body.appendChild(stats.domElement);

const mouseNDC = new THREE.Vector2();
const mouse = new THREE.Vector2();

function onMouseMove(event) {
  mouse.x = event.clientX;
  mouse.y = event.clientY;

  mouseNDC.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouseNDC.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

const floader = new THREE.FileLoader();
floader.load("/src/assets/UN_Capital_Cities_2014.csv", function (data) {
  const capitals = CSVToArray(data, ";");
  earth.updateMatrixWorld();

  capitals.forEach(function (line, index) {
    if (index === 0) return;

    const country = line[0];
    const capital = line[1];
    const lat = parseFloat(line[2]);
    const lon = parseFloat(line[3]);
    const population = parseInt(line[4]);

    console.log(`Capital: ${capital}, lat: ${lat}, lon: ${lon}`);

    const position = latLonToVector3(lat, lon, 15);

    const geometry = new THREE.SphereGeometry(0.15, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const citySphere = new THREE.Mesh(geometry, material);

    citySphere.position.copy(position);

    citySphere.infoData = {
      country: country,
      capital: capital,
      population: population,
    };

    earth.add(citySphere);

    capitalSpheres.push(citySphere);
  });
});

const capitalSpheres = [];

const raycaster = new THREE.Raycaster();
let hoveredCapital = null;

window.addEventListener("mousemove", onMouseMove, false);


function render() {
  controls.update();

  if (controlParams.animation) {
    earth.rotation.y -= controlParams.rotationSpeed;
    clouds.rotation.y -= controlParams.rotationSpeed;
    moonPivot.rotation.y += controlParams.rotationSpeedMoon;
  }

  const maxDistanceForHover = 50;
  const distance = camera.position.distanceTo(earth.position);

  if (distance < maxDistanceForHover) {
    raycaster.setFromCamera(mouseNDC, camera);
    const intersects = raycaster.intersectObjects(earth.children);

    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;

      if (hoveredCapital !== intersectedObject) {
        // Si on change de capitale survolée, reset la précédente
        if (hoveredCapital) {
          hoveredCapital.material.color.set(0xff0000);
          const oldTooltip = document.getElementById("info");
          if (oldTooltip) document.body.removeChild(oldTooltip);
        }

        intersectedObject.material.color.set(0x00ff00);

        const div = document.createElement("div");
        div.id = "info";
        div.className = "label";
        const country = "Pays : " + intersectedObject.infoData.country;
        const city = "Capitale : " + intersectedObject.infoData.capital;
        const population =
          "Population (en milliers) : " + intersectedObject.infoData.population;
        div.innerHTML = `${country}<br>${city}<br>${population}`;
        div.style.position = "absolute";
        div.style.top = mouse.y + "px";
        div.style.left = mouse.x + "px";
        div.style.backgroundColor = "rgba(0,0,0,0.7)";
        div.style.color = "white";
        div.style.padding = "5px";
        div.style.borderRadius = "5px";
        div.style.pointerEvents = "none";
        document.body.appendChild(div);

        hoveredCapital = intersectedObject;
        controlParams.animation = false;
      }
    } else {
      if (hoveredCapital) {
        hoveredCapital.material.color.set(0xff0000);
        hoveredCapital = null;
        controlParams.animation = true;

        const tooltip = document.getElementById("info");
        if (tooltip) {
          document.body.removeChild(tooltip);
        }
      }
    }
  } else {
    if (hoveredCapital) {
      hoveredCapital.material.color.set(0xff0000);
      hoveredCapital = null;
      controlParams.animation = true;

      const tooltip = document.getElementById("info");
      if (tooltip) {
        document.body.removeChild(tooltip);
      }
    }
  }

  renderer.render(scene, camera);
  stats.update();
  requestAnimationFrame(render);
}

render();
