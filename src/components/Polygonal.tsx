import React, { useEffect, useState } from 'react'
import { Point } from '../App'
import { Circle, Group, Line, Rect } from 'react-konva';
interface PolygonalProps {
    points: Point[],
    selected: boolean,
}
const Polygonal: React.FC<PolygonalProps> = ({points, selected}) => {
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
    },[points])
  return (
    <Group
        draggable={closedShape}

    >
        <Line points={flatMapPoints} stroke={"red"} strokeWidth={selected ? 4 : 2}></Line>
     {points.map((i,ix)=>{
        return <Rect
        draggable={true}
            x={i.x - 5}
            y={i.y - 5 }
            fill='red'
            width={10}
            height={10}
        ></Rect>
     })}   
    </Group>

    )
}

export default Polygonal