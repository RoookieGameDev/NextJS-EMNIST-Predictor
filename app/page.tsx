"use client";
import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import './globals.css';
 
const characters = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
 
const Home: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [model, setModel] = useState<tf.LayersModel | null>(null);
 
    const [isPainting, setIsPainting] = useState<boolean>(false);
    const [mousePosition, setMousePosition] = useState<{x: number; y: number} | undefined>(undefined);
    const [prediction, setPrediction] = useState<string>('');
    const [confidence, setConfidence] = useState<string>('');
 
    useEffect(() => {
        const loadModel = async () => {
            const loadedModel = await tf.loadLayersModel('/model/model.json');
            setModel(loadedModel);
            console.log('Model loaded');
        };
        loadModel();
    }, []);
 
    const getMousePos = (canvas: HTMLCanvasElement, event: MouseEvent) => {
        const rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    };
 
    const startPainting = (event: MouseEvent) => {
        const coordinates = getMousePos(canvasRef.current!, event);
        if (coordinates) {
            setIsPainting(true);
            setMousePosition(coordinates);
        }
    };
 
    const paint = (event: MouseEvent) => {
        if (isPainting) {
            const newMousePosition = getMousePos(canvasRef.current!, event);
            if (mousePosition && newMousePosition) {
                drawLine(mousePosition, newMousePosition);
                setMousePosition(newMousePosition);
            }
        }
    };
 
    const stopPainting = () => {
        setIsPainting(false);
        predict();
    };
 
    const drawLine = (originalMousePosition: {x: number; y: number}, newMousePosition: {x: number; y: number}) => {
        const canvas = canvasRef.current;
        const context = canvas!.getContext('2d')!;
        context.strokeStyle = 'white';
        context.lineJoin = 'round';
        context.lineWidth = 12;
 
        context.beginPath();
        context.moveTo(originalMousePosition.x, originalMousePosition.y);
        context.lineTo(newMousePosition.x, newMousePosition.y);
        context.closePath();
 
        context.stroke();
    };
 
    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const context = canvas!.getContext('2d')!;
        context.clearRect(0, 0, canvas!.width, canvas!.height);
        setPrediction('');
        setConfidence('');
    };
 
    const preprocessCanvas = (canvas: HTMLCanvasElement) => {
        return tf.tidy(() => {
            let tensor = tf.browser.fromPixels(canvas)
                .resizeNearestNeighbor([28, 28])
                .mean(2)
                .expandDims(2)
                .expandDims()
                .toFloat();
            return tensor.div(255.0);
        });
    };
 
    const predict = async () => {
        if (canvasRef.current && model) {
            const preprocessed = preprocessCanvas(canvasRef.current);
            const prediction =  model.predict(preprocessed) as tf.Tensor<tf.Rank>;
            const predictionData = await prediction.data();
            // @ts-ignore
            const predictedIndex = predictionData.indexOf(Math.max(...predictionData));
            setPrediction(characters[predictedIndex]);
            // @ts-ignore
            setConfidence((Math.max(...predictionData) * 100).toFixed(2) + '%');
        }
    };
 
    return (
        <div>
            <h1>Reconnaissance de Caractères</h1>
            <p>Prédit les caractères manuscrits en utilisant un modèle de deep learning.</p>
            <p>Construit avec TensorFlow.js et Next.js</p>
            <section>
                <canvas
                    id="main-canvas"
                    ref={canvasRef}
                    width="300"
                    height="300"
                    // @ts-ignore
                    onMouseDown={startPainting}
                    onMouseUp={stopPainting}
                    onMouseLeave={stopPainting}
                    // @ts-ignore
                    onMouseMove={paint}
                    style={{background: 'black'}}
                ></canvas>
                <div id="prediction">
                    {prediction}
                </div>
            </section>
            <div>
                <button onClick={clearCanvas}>Effacer</button>
            </div>
            <div>
                <p>Confidence: {confidence}</p>
            </div>
        </div>
    );
};
 
export default Home;