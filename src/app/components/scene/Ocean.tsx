'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { skyState, spaceState } from '../../state'

// Gerstner波 + マイクロリップル + 解析的空反射 + 深度グラデーション + 岸辺フォーム
export function Ocean() {
  const meshRef   = useRef<THREE.Mesh>(null)
  const shaderRef = useRef<THREE.WebGLProgramParametersWithUniforms | null>(null)

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: '#1a5a9a', roughness: 0.18, metalness: 0.15,
    })

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.u_time = { value: 0 }
      shader.uniforms.u_skyP = { value: 0 }
      shaderRef.current = shader

      shader.vertexShader = /* glsl */`
        uniform float u_time;
        varying float v_waveH;
        varying vec3  v_worldPos;
        varying vec3  v_worldNorm;

        vec3 gWave(vec2 d, float A, float Q, float k, float spd,
                   vec2 p, float t, inout vec3 n) {
          d = normalize(d);
          float ph = dot(d,p)*k - spd*t;
          float c=cos(ph), s=sin(ph);
          n.x -= d.x*k*A*c; n.y -= d.y*k*A*c; n.z -= Q*k*A*s;
          return vec3(Q*A*d.x*c, Q*A*d.y*c, A*s);
        }
      ` + shader.vertexShader

      shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        /* glsl */`
        vec2 _np=vec2(position.x,position.y); vec3 _n=vec3(0.,0.,1.);
        gWave(vec2( 1.0, 0.3),0.13,0.55,0.44,0.80,_np,u_time,_n);
        gWave(vec2( 0.2, 0.9),0.09,0.50,0.68,0.97,_np,u_time,_n);
        gWave(vec2(-0.4, 0.7),0.07,0.45,1.08,1.22,_np,u_time,_n);
        gWave(vec2( 0.8,-0.5),0.04,0.35,1.72,1.68,_np,u_time,_n);
        gWave(vec2(-0.7,-0.6),0.025,0.25,2.60,2.50,_np,u_time,_n);
        vec3 objectNormal=normalize(_n);
        v_worldNorm=normalize(vec3(objectNormal.x,objectNormal.z,-objectNormal.y));
        `
      )

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        /* glsl */`
        #include <begin_vertex>
        vec2 _pp=vec2(position.x,position.y); vec3 _pn=vec3(0.,0.,1.); vec3 gS=vec3(0.);
        gS+=gWave(vec2( 1.0, 0.3),0.13,0.55,0.44,0.80,_pp,u_time,_pn);
        gS+=gWave(vec2( 0.2, 0.9),0.09,0.50,0.68,0.97,_pp,u_time,_pn);
        gS+=gWave(vec2(-0.4, 0.7),0.07,0.45,1.08,1.22,_pp,u_time,_pn);
        gS+=gWave(vec2( 0.8,-0.5),0.04,0.35,1.72,1.68,_pp,u_time,_pn);
        gS+=gWave(vec2(-0.7,-0.6),0.025,0.25,2.60,2.50,_pp,u_time,_pn);
        transformed.x+=gS.x; transformed.y+=gS.y; transformed.z+=gS.z;
        v_waveH=gS.z;
        v_worldPos=(modelMatrix*vec4(transformed,1.0)).xyz;
        `
      )

      shader.fragmentShader = /* glsl */`
        uniform float u_time;
        uniform float u_skyP;
        varying float v_waveH;
        varying vec3  v_worldPos;
        varying vec3  v_worldNorm;

        float _h(vec2 p){
          p=fract(p*vec2(0.1031,0.1030)); p+=dot(p,p.yx+33.33);
          return fract((p.x+p.y)*p.x);
        }
        float _vn(vec2 p){
          vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
          return mix(mix(_h(i),_h(i+vec2(1,0)),f.x),
                     mix(_h(i+vec2(0,1)),_h(i+vec2(1,1)),f.x),f.y);
        }
        float _fbm(vec2 p){
          return _vn(p)*0.50 + _vn(p*2.1+vec2(3.7,1.9))*0.32 + _vn(p*4.6-vec2(1.3,4.1))*0.18;
        }
      ` + shader.fragmentShader

      shader.fragmentShader = shader.fragmentShader.replace(
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        /* glsl */`
        float _dist = length(v_worldPos.xz);
        float _dep = smoothstep(0.8, 22.0, _dist);
        float _cur = _vn(v_worldPos.xz * 0.04 + u_time * 0.007) * 0.5
                   + _vn(v_worldPos.xz * 0.09 - u_time * 0.005) * 0.3
                   + _vn(v_worldPos.xz * 0.18 + u_time * 0.012) * 0.2;
        float _depV = clamp(_dep + (_cur - 0.5) * 0.28, 0.0, 1.0);
        vec3 _colShallow = mix(vec3(0.18,0.70,0.60), vec3(0.04,0.22,0.28), u_skyP);
        vec3 _colMid     = mix(vec3(0.08,0.48,0.62), vec3(0.02,0.14,0.34), u_skyP);
        vec3 _colDeep    = mix(vec3(0.05,0.28,0.55), vec3(0.01,0.06,0.22), u_skyP);
        vec3 _wCol = mix(
          mix(_colShallow, _colMid,  smoothstep(0.0, 0.5,  _depV)),
          _colDeep,
          smoothstep(0.38, 1.0, _depV)
        );
        vec4 diffuseColor = vec4(_wCol, opacity);
        `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <output_fragment>',
        /* glsl */`
        vec3 _toC = normalize(cameraPosition - v_worldPos);

        vec2 _uv = v_worldPos.xz;
        float _ee = 0.06;
        float _n0 = _fbm(_uv*3.2 + u_time*0.045);
        float _nx = _fbm((_uv+vec2(_ee,0.))*3.2 + u_time*0.045) - _n0;
        float _ny = _fbm((_uv+vec2(0.,_ee))*3.2 + u_time*0.045) - _n0;
        float _n0b = _fbm(_uv*8.5 - u_time*0.07);
        float _nxb = _fbm((_uv+vec2(_ee,0.))*8.5 - u_time*0.07) - _n0b;
        float _nyb = _fbm((_uv+vec2(0.,_ee))*8.5 - u_time*0.07) - _n0b;
        vec3 _microN = normalize(
          v_worldNorm
          + vec3(_nx/_ee*0.14 + _nxb/_ee*0.06, 0., _ny/_ee*0.14 + _nyb/_ee*0.06)
        );

        float _NdV  = clamp(dot(_microN, _toC), 0., 1.);
        float _fres = pow(1. - _NdV, 4.5);

        vec3 _rD = reflect(-_toC, _microN);
        float _skyT = clamp(_rD.y*0.5+0.5, 0., 1.);
        float _p1   = smoothstep(0.,.55,u_skyP), _p2=smoothstep(.45,1.,u_skyP);
        vec3 _sTop  = mix(mix(vec3(.28,.58,.92),vec3(.08,.12,.38),_p1),vec3(.02,.04,.13),_p2);
        vec3 _sBot  = mix(mix(vec3(.72,.88,1.0),vec3(.90,.30,.06),_p1),vec3(.04,.07,.18),_p2);
        vec3 _refSky = mix(_sBot, _sTop, _skyT);
        _refSky += vec3(1.,.45,.10) * exp(-8.*abs(_rD.y)) * (1.-_p2)*_p1*0.9;

        float _foam = smoothstep(.10,.21,v_waveH) * 0.34;
        float _sd   = length(v_worldPos.xz);
        float _sp   = 1. - smoothstep(1.0, 2.8, _sd);
        float _sf   = _sp * (0.35 + 0.65*sin(_sd*9. - u_time*1.5)) * 0.28;
        vec3 _sss   = vec3(.03,.20,.38) * max(0.,-v_waveH) * (1.-u_skyP) * 0.24;

        vec3 _sunD  = normalize(vec3(8.,10.,6.));
        float _sunS = pow(max(0.,dot(reflect(-_sunD,_microN),_toC)), 220.);
        vec3 _spark = _sunS * vec3(1.,.97,.85) * (1.-u_skyP) * 5.0;

        vec3 _moonD = normalize(vec3(-18.,14.,-22.) - v_worldPos);
        float _moonS = pow(max(0.,dot(reflect(-_moonD,_microN),_toC)), 100.);
        vec3 _mShim  = _moonS * vec3(.6,.75,1.) * u_skyP * 2.4;

        outgoingLight += _fres*_refSky*0.32 + _foam + _sf + _sss + _spark + _mShim;

        #include <output_fragment>
        `
      )
    }

    mat.customProgramCacheKey = () => 'enoshima-ocean-v4'
    return mat
  }, [])

  useFrame((state) => {
    if (meshRef.current) meshRef.current.visible = spaceState.t < 0.08
    if (!shaderRef.current) return
    shaderRef.current.uniforms.u_time.value = state.clock.getElapsedTime()
    shaderRef.current.uniforms.u_skyP.value = skyState.progress
  })

  return (
    <mesh ref={meshRef} material={material} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.52, 0]}>
      <planeGeometry args={[60, 60, 180, 180]} />
    </mesh>
  )
}
