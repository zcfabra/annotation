import React, { useEffect, useRef, useState } from 'react'
import reactLogo from './assets/react.svg'
import './index.css'
import { Image, Layer, Stage ,Rect} from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { Vector2d } from 'konva/lib/types';
import Polygonal from './components/Polygonal';

export type Point={
  x: number,
  y: number
}

export interface Annotation{
  label: string, 
  points: Point[],
  type: string,
  class?: string,
  classColor?: string,
}

export type ClassData ={
  class: string, 
  colorHex: string, 
}

export const colorMap={
  "red": "bg-red-500",
  "Orchid": "bg-purple-500",
  "Lime": "bg-lime-500",
  "Cyan": "bg-cyan-500",
  "HotPink": "bg-pink-500",
  "DarkOrange": "bg-orange-500"
}

function App() {
  const [image, setImage] = useState<ImageBitmap | HTMLImageElement  | null>(null);
  const [annotationType, setAnnotationType] = useState<string>("Box");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [label, setLabel] = useState<string>("")
  const [imageSize, setImageSize] = useState<{x:number,y:number,h:number,w:number} | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<number | null>(null);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [currentClass, setCurrentClass] = useState<ClassData|null>(null);
  const [isMouseOverStartPoint, setIsMouseOverStartPoint] = useState<boolean>(false);


  
  /* Takes in an image from an HTML upload, then converts it into an image bitmap (a suitable form for drawing onto a canvas)
  Then, it scales the image down to fit and be centered within the canvas. The width of the canvas is accessed via a ref
  */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>)=>{
    if (e.target.files && e.target.files.length > 0){
      const img = e.target.files[0];
      const arrayBuffer = await img.arrayBuffer();
      const mid = new Blob([new Uint8Array(arrayBuffer)]);
      const bitmap = await createImageBitmap(mid);

      setImage(bitmap);
      if (sizeRef.current){

        const bound = sizeRef.current.getBoundingClientRect();
        const scalingFactor = Math.min(bound.width / bitmap.width, bound.height / bitmap.height);
        const scaledWidth = bitmap.width * scalingFactor; const scaledHeight = bitmap.height * scalingFactor;
        const centerX = (bound.width / 2) - (scaledWidth / 2); const centerY = (bound.height / 2) - (scaledHeight/ 2);

        setImageSize({x: centerX ,y: centerY, w: scaledWidth, h: scaledHeight});
      }
    }

  }

  


  const sizeRef = useRef<HTMLDivElement>(null);
  const [size, setSize]=useState<{x:number, y:number}>();
  useEffect(()=>{
    if (sizeRef.current){
      const bound = sizeRef.current.getBoundingClientRect();
      setSize({x: bound.width, y: bound.height});
    }
  }, [sizeRef]);

  const [startBox, setStartBox] = useState<Vector2d | null>(null);

  useEffect(()=>{
    console.log(annotations)
  }, [annotations])

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>)=>{
    // Important to do a not null check here rather than simple a truthy check because the selectedAnnotation
    // is an index of an array and therefore can be 0 which will fail the truthy check but pass the non-null
    if (selectedAnnotation !=null){

        if ( annotations[selectedAnnotation].type == "Box"){
          const stage = e.currentTarget.getStage();
          if (stage){
            const mousePos = stage.getPointerPosition();
            if (mousePos){
              setStartBox(mousePos);
            }
          }
        } else if (annotations[selectedAnnotation].type == "Polygonal"){
          console.log("hi")
          const stage = e.currentTarget.getStage();
          if (stage){
            const mousePos = stage.getPointerPosition();
            if (mousePos){         
                const lengthOfList = annotations[selectedAnnotation].points.length; 
              // Ok so this check is very hacky. I probably should extract the completedShape logic out into the Annotation Class
              // although I do like having the same api for both types of annotation class      
              if (lengthOfList >3 && annotations[selectedAnnotation].points[0].x == annotations[selectedAnnotation].points[lengthOfList - 1].x && annotations[selectedAnnotation].points[0].y == annotations[selectedAnnotation].points[lengthOfList - 1].y ){
                return;
              }
                setAnnotations(prev=>{
                  const prevPoints = prev[selectedAnnotation].points;
                  // if the start point is being hovered, this will close the shape by adding
                  // the final point which is a clone of the starting point
                  const pointToAdd = isMouseOverStartPoint ? prevPoints[0] : { x: mousePos.x, y: mousePos.y }
                  prev[selectedAnnotation] = {
                    ...prev[selectedAnnotation],
        
                    points: [...prevPoints, pointToAdd]
                  }
                  
                  return [...prev];
                })
            }
          }
        }
    }
  }
  // const [startBox, setStartBox];
  const handleMouseMove = (e: KonvaEventObject<MouseEvent>)=>{
    if (startBox && selectedAnnotation != null && annotations[selectedAnnotation]){
      const stage = e.currentTarget.getStage();
      if (stage){
        const mousePos = stage.getPointerPosition();
        if (mousePos){
          console.log("set")
          setAnnotations(prev=>{
            prev[selectedAnnotation] = {
              ...prev[selectedAnnotation],
              points: [{x: startBox.x, y: startBox.y}, {x: mousePos.x, y:mousePos.y}]
            }
            return [...prev];
          })
        }
      }
    }
  }

  const handleEndDrawBox = (e: KonvaEventObject<MouseEvent>)=>{
    if (selectedAnnotation!=null && annotations[selectedAnnotation].type == "Box"){
      setStartBox(null);
    }
  }

  const handleCreateNewAnnotation = ()=>{
    const newAnnotation: Annotation = {
      label: label,
      type: annotationType,
      points: []
    }
    const ix = annotations.length;
    setAnnotations(prev=>[...prev, newAnnotation]);
    setSelectedAnnotation(ix);
    setLabel("");

  }
  const handleDeleteAnnotation = (ix: number)=>{
    if (ix == selectedAnnotation) setSelectedAnnotation(null);
    setAnnotations(prev=>{
      return prev.filter((i,idx)=>idx != ix);
    })
  }

  const handleUndoPolygon = ()=>{
    if (selectedAnnotation!=null){
      console.log("YO")
      setAnnotations(prev=>{
        prev[selectedAnnotation] = {
          ...prev[selectedAnnotation],
          points: prev[selectedAnnotation].points.slice(0,-1)
        }
        return [...prev]
      })
    }
  }
  const handleClearPolygon = ()=>{
    if (selectedAnnotation!=null){
      setAnnotations(prev=>{
        prev[selectedAnnotation]={
          ...prev[selectedAnnotation],
          points: []
        }
        return [...prev];
      })
    }
  }

  const handleAddClass=()=>{
    if (currentClass) {
      let className = currentClass.class
      while (classes.find(i=>i.class == className) != undefined){
        className += "_"
      }
      setClasses(prev=>[...prev, {class: className, colorHex: currentClass.colorHex}])
    } 
    setCurrentClass(null);
  }

  const handleSetAnnotationClass = (e: React.ChangeEvent<HTMLSelectElement>, ix: number)=>{

    setAnnotations(prev=>{
      const findColor = classes.find(i=>i.class == e.target.value);
      if (findColor) {
        prev[ix] = {
          ...prev[ix],
          class: e.target.value,
          classColor:findColor.colorHex
        } 
      } else {
        prev[ix]={
          ...prev[ix],
          class:e.target.value,
        }
      }
      return [...prev];
    });

  }

  const findTailwindColorCodeForClass= (soughtClass: string):string | null=>{
    const classData = classes.find(i=>i.class==soughtClass);
    if (classData) return colorMap[classData.colorHex as keyof object] 
    else return null;
  }
  return (
    <div className="w-full h-screen bg-black flex flex-row">
      <div ref={sizeRef} className='relative w-9/12 h-full'>
        {selectedAnnotation != null && annotations[selectedAnnotation].type == "Polygonal" && annotations[selectedAnnotation].points.length>0 && <div className='z-20 w-42 h-8  text-white absolute top-4 right-4 flex items-center justify-center'>
          <button onClick={handleUndoPolygon}className='w-16 h-8 rounded-md border border-gray-500 mx-1 hover:bg-purple-500 transition-all'>Undo</button>
          <button onClick={handleClearPolygon}className='w-16 h-8 rounded-md border border-gray-500 mx-1 hover:bg-purple-500 transition-all'>Clear</button>
        </div> }
        <Stage
          width={size?.x || 0}
          height={size?.y || 0}
          className={`border border-gray-500 ${selectedAnnotation!=null && "cursor-crosshair"}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleEndDrawBox}
          >
          <Layer >
            {image && imageSize && <Image x={imageSize.x} y={imageSize.y} image={image} width={imageSize.w} height={imageSize.h}></Image> }
            {annotations.map((i,ix)=>{
              if (i.type == "Box" && i.points.length == 2){
                const start = i.points[0];
                const end = i.points[1];
                const width = end.x - start.x;
                const height = end.y - start.y;
                return <Rect   stroke={i.classColor ? i.classColor : "blue"} strokeWidth={ix == selectedAnnotation ? 5: 2}  x={start.x} y={start.y} width={width} height={height}></Rect>
              } else if (i.type == "Polygonal" && i.points.length > 0){
                return <Polygonal color={i.classColor} idx={ix} isMouseOverStartPoint={isMouseOverStartPoint}setIsMouseOverStartPoint={setIsMouseOverStartPoint} setAnnotations={setAnnotations} selected={selectedAnnotation == ix} points={i.points}></Polygonal>
              }
            })}
          </Layer>

        </Stage>

      </div>
      <div className='h-full w-3/12 flex flex-col items-center'>
        <div className='w-full h-[15%] p-8 flex flex-col '>
          <span className='text-xl text-white mb-4'>Image</span>
          {image == null
          ? 
          <input type="file" accept="image/*" multiple={false} onChange={handleImageUpload} />
          : 
          <button onClick={()=>setImage(null)}className='w-24 h-12 rounded-md border border-gray-500 text-white'>Delete</button> }

        </div>
        <div className='w-full h-[25%] border-y border border-gray-500 px-8 py-4 flex'>
          <div className='w-6/12 h-full'>
            <input onChange={(e)=>setCurrentClass({class: e.target.value, colorHex: "#ff0000"})}value={currentClass ? currentClass.class : ""} className="w-40 h-8 rounded-md border border-gray-500  bg-black  text-white px-4 "type="text" placeholder='New Class'/>
            <div className='w-full flex mt-2'>
              {currentClass && Object.keys(colorMap).map(i=>{
                return <div onClick={()=>setCurrentClass(prev=>({class:prev!.class, colorHex: i}))} className={`w-4 ${currentClass && i == currentClass.colorHex && "border-2 border-white"} h-4 mx-2 ${colorMap[i as keyof object]}`}></div>
              })}
            </div>
            {currentClass && currentClass.class != "" && <button onClick={handleAddClass} className='w-24 mt-4 h-8 rounded-md border border-gray-500 text-white'>Add</button>}
          </div>
          <div className='w-6/12 h-full overflow-y-auto'>
            {classes.map((i,ix)=>(
              <div className='w-full px-2 flex items-center h-12 text-white border-b border-gray-500 '>
                <span>{i.class}</span>
                <div className={`ml-4 w-2 h-2 rounded-md ${colorMap[i.colorHex as keyof object]}`}></div>
                <button onClick={()=>setClasses(prev=>prev.filter((i,idx)=>idx != ix))}className='text-white ml-auto'>X</button>
              </div>
            ))}
          </div>
        </div>
        <div className='w-full h-[20%] border-y border border-gray-500 pt-4 px-8 flex flex-col'>
          <span className='text-xl text-white mb-4
          '>New Annotation</span>
          <input value={label} onChange={(e)=>setLabel(e.target.value)} type="text" placeholder='Label' className='px-4 bg-transparent text-white h-10 border border-gray-500 rounded-md'/>
          <div className='w-full h-10 mt-4 flex'>

            <button onClick={()=>setAnnotationType("Box")}      className={`w-24 h-10 ${annotationType == "Box" && "bg-purple-500"} rounded-md text-white border border-gray-500`}>Box</button>
            <button onClick={()=>setAnnotationType("Polygonal")}className={`w-24 h-10 ${annotationType == "Polygonal" && "bg-purple-500"} rounded-md text-white border border-gray-500`}>Polygonal</button>
            <button onClick={handleCreateNewAnnotation}className='w-10 rounded-md text-white ml-auto h-10 border border-gray-500'>+</button>
          </div>
        </div>
        <div className='w-full h-[40%] overflow-y-auto'>
          {annotations.map((i,ix)=>(
            <div onClick={() => setSelectedAnnotation(ix == selectedAnnotation ? null : ix)} className={`w-full flex items-center cursor-pointer h-16 text-white  pt-4 px-8 ${selectedAnnotation == ix && "bg-purple-500 "} border-b border-gray-500`}>
              <span className='text-white'>{i.label == "" ? "Unlabeled" : i.label}</span>
              {i.class && <div className={`mr-2 w-2 h-2 rounded-md ${findTailwindColorCodeForClass(i.class)}`}></div>}
              <div className='ml-auto flex'>
                
              { classes.length > 0 && <select onChange={(e)=>handleSetAnnotationClass(e, ix)}value={i.class} className="h-8 border border-gray-500 rounded-md w-28 mr-2 bg-black text-white"name="" id="">
                <option value="" selected disabled>Select...</option>
                {
                  classes.map((i,ix)=> <option value={i.class}>{i.class}</option> )
                }</select>
              }
              <button onClick={()=>handleDeleteAnnotation(ix)} className=' text-white w-16 h-8 rounded-md border border-gray-500'>Delete</button>
              </div>
            </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default App;
