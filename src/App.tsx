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

interface Annotation{
  label: string, 
  points: Point[],
  type: string
}


function App() {
  const [image, setImage] = useState<ImageBitmap | HTMLImageElement  | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [annotationType, setAnnotationType] = useState<string>("Box");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [boxStartingPoint, setBoxStartingPoint] = useState<{x:number,y:number} | null>(null);
  const [label, setLabel] = useState<string>("")
  const [imageSize, setImageSize] = useState<{x:number,y:number,h:number,w:number} | null>(null);
  const [selectedAnnotation, setSelectedAnnotation] = useState<number | null>(null);

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
              setAnnotations(prev=>{
                const prevPoints = prev[selectedAnnotation].points;
                prev[selectedAnnotation] = {
                  ...prev[selectedAnnotation],
                  points: [...prevPoints, {x: mousePos.x, y:mousePos.y}]
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
  return (
    <div className="w-full h-screen bg-black flex flex-row">
      <div ref={sizeRef} className='w-9/12 h-full'>
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
                return <Rect stroke={"red"} strokeWidth={ix == selectedAnnotation ? 5: 2}  x={start.x} y={start.y} width={width} height={height}></Rect>
              } else if (i.type == "Polygonal" && i.points.length > 0){
                return <Polygonal selected={selectedAnnotation == ix} points={i.points}></Polygonal>
              }
            })}
          </Layer>

        </Stage>

      </div>
      <div className='h-full w-3/12 flex flex-col items-center'>
        <div className='w-full h-1/6 p-8 '>
          {image == null
          ? 
           <input type="file" accept="image/*" multiple={false} onChange={handleImageUpload} />
          : 
          <button onClick={()=>setImage(null)}className='w-24 h-12 rounded-md border border-gray-500 text-white'>Delete</button> }

        </div>
        <div className='w-full h-1/6 border-y border border-gray-500 pt-8 px-8 flex flex-col'>
          <input value={label} onChange={(e)=>setLabel(e.target.value)} type="text" placeholder='Label' className='px-4 bg-transparent text-white h-10 border border-gray-500 rounded-md'/>
          <div className='w-full h-10 mt-4 flex'>

            <button onClick={()=>setAnnotationType("Box")}      className={`w-24 h-10 ${annotationType == "Box" && "bg-purple-500"} rounded-md text-white border border-gray-500`}>Box</button>
            <button onClick={()=>setAnnotationType("Polygonal")}className={`w-24 h-10 ${annotationType == "Polygonal" && "bg-purple-500"} rounded-md text-white border border-gray-500`}>Polygonal</button>
            <button onClick={handleCreateNewAnnotation}className='w-10 rounded-md text-white ml-auto h-10 border border-gray-500'>+</button>
          </div>
        </div>
        <div className='w-full h-4/6 overflow-y-auto'>
          {annotations.map((i,ix)=>(
            <div onClick={() => setSelectedAnnotation(ix)} className={`w-full flex cursor-pointer h-16 text-white  pt-4 px-8 ${selectedAnnotation == ix && "bg-purple-500 "} border-b border-gray-500`}>
              <span>{i.label}</span>
              <button onClick={()=>handleDeleteAnnotation(ix)} className='ml-auto text-white w-16 h-8 rounded-md border border-gray-500'>Delete</button>
            </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default App;
