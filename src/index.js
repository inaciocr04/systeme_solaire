import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import WebGL from "three/examples/jsm/capabilities/WebGL.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import Stats from "three/examples/jsm/libs/stats.module.js";

if (!WebGL.isWebGL2Available()) {
  const warning = WebGL.getWebGL2ErrorMessage();
  document.getElementById("container").appendChild(warning);
}

const renderer = new THREE.WebGLRenderer({ antialias: true });
const container = document.getElementById("container");
renderer.setSize(
  container.clientWidth, // largeur du rendu
  container.clientHeight // hauteur du rendu
);

container.appendChild(renderer.domElement);

renderer.setClearColor(0x000000, 1.0); // fond noir
renderer.clear();

const fov = 45; // Angle de vue vertical
const aspect = window.innerWidth / window.innerHeight; // Rapport largeur/hauteur
const near = 1; // Distance du plan proche
const far = 1000; // Distance du plan éloigné
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

camera.position.set(30, 2, 60);

// Vecteur unitaire donnant la verticale de la caméra
camera.up = new THREE.Vector3(0, 1, 0);
// Point observé dans la scène qui se projetera
// au centre de l'image
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
const moonMap = textureLoader.load("/src/img/lroc_color_poles_2k.jpg");
const moonNormalMap = textureLoader.load(
  "/src/img/moon__luna__texture_map_by_oleg_pluton_dcwk818-fullview.jpg"
);

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

const stats = new Stats();
document.body.appendChild(stats.domElement);

function render() {
  controls.update();

  if (controlParams.animation) {
    earth.rotation.y -= controlParams.rotationSpeed;
    clouds.rotation.y -= controlParams.rotationSpeed;
    moonPivot.rotation.y += controlParams.rotationSpeedMoon;
  }

  renderer.render(scene, camera);
  stats.update();
  requestAnimationFrame(render);
}
render();
