import React, { useEffect, useState } from 'react'
import { Annotation, Point } from '../App'
import { Circle, Group, Line, Rect } from 'react-konva';
import { KonvaEventObject } from 'konva/lib/Node';
interface PolygonalProps {
    points: Point[],
    selected: boolean,
    setAnnotations: React.Dispatch<React.SetStateAction<Annotation[]>>,
    setIsMouseOverStartPoint: React.Dispatch<React.SetStateAction<boolean>>,
    isMouseOverStartPoint: boolean,

}
const Polygonal: React.FC<PolygonalProps> = ({points, selected, setAnnotations, setIsMouseOverStartPoint, isMouseOverStartPoint}) => {
    const [closedShape, setClosedShape] = useState<boolean>(false);
    const [flatMapPoints, setFlatMapPoints] = useState<number[]>([]);

    // The konva JS line element takes in a flat list of points in the form of [x1, y1, x2, y2, etc...], so it is important to perform
    // this transformation whenever the point data changes
    useEffect(()=>{
        const flat = [];
        for (let point of points){
            flat.push(point.x);
            flat.push(point.y);
        }
        setFlatMapPoints(flat);
    },[points]);


    const handleMouseOverPoint = (e: KonvaEventObject<MouseEvent>, ix:number)=>{
        if (ix ==1 || closedShape){
            e.target.scale({x:2,y:2});
            setIsMouseOverStartPoint(true);
        }
        if (closedShape) {
            e.target.getStage()!.container().style.cursor = "pointer"
        }

    }
    const handleMouseLeavePoint = (e: KonvaEventObject<MouseEvent>,ix:number)=>{
        console.log(ix);
        if (ix ==1 || closedShape){
            e.target.scale({x: 1, y:1});
            setIsMouseOverStartPoint(false);
        }
        if (closedShape){
            e.target.getStage()!.container().style.cursor = "default"
        }
    }
    const handleMouseDown = (e: KonvaEventObject<MouseEvent>)=>{
        if (isMouseOverStartPoint) setClosedShape(true);
    }
  return (
    <Group
        // draggable={closedShape}

    >
        <Line points={flatMapPoints} stroke={"red"} strokeWidth={selected ? 4 : 2}></Line>
     {points.map((i,ix)=>{
        return <Rect
            draggable={closedShape}
            x={i.x - 5}
            y={i.y - 5 }
            fill='red'
            
            width={10}
            height={10}
            onMouseOver={(e)=>handleMouseOverPoint(e,ix)}
            onMouseLeave={(e)=>handleMouseLeavePoint(e,ix)}
            onMouseDown={handleMouseDown}
        ></Rect>
     })}   
    </Group>

    )
}

export default Polygonal