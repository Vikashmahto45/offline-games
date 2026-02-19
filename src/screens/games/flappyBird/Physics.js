import Matter from 'matter-js';
import { Dimensions } from 'react-native';
import { Constants } from './Constants';
import PipeRenderer from './Pipe';

const { width, height } = Dimensions.get('window');

let pipeCounter = 0;

const Physics = (entities, { touches, time, dispatch }) => {
    let engine = entities.physics.engine;

    // Jump
    touches.filter(t => t.type === 'start').forEach(t => {
        Matter.Body.setVelocity(entities.Bird.body, {
            x: 0,
            y: Constants.PHYSICS.jumpForce
        });
        dispatch({ type: 'flap' });
    });

    // Update Engine
    Matter.Engine.update(engine, time.delta);

    // Spawn Pipes
    // We use a timer attached to physics entity or global?
    // Let's attach to entities.physics
    if (!entities.physics.lastPipeTime) entities.physics.lastPipeTime = 0;
    entities.physics.lastPipeTime += time.delta;

    if (entities.physics.lastPipeTime > 2000) { // Spawn every 2s
        entities.physics.lastPipeTime = 0;
        pipeCounter++;

        const pipeGap = Constants.GAP_SIZE;
        // Random height for top pipe
        const minPipeHeight = 100;
        const maxPipeHeight = height - pipeGap - 100;
        const topPipeHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;

        const bottomPipeHeight = height - topPipeHeight - pipeGap;

        // Create Bodies
        // Top Pipe (y is center)
        const topBody = Matter.Bodies.rectangle(
            width + Constants.PIPE_WIDTH / 2,
            topPipeHeight / 2,
            Constants.PIPE_WIDTH,
            topPipeHeight,
            { isStatic: true, label: 'Pipe' }
        );

        // Bottom Pipe
        const bottomBody = Matter.Bodies.rectangle(
            width + Constants.PIPE_WIDTH / 2,
            height - bottomPipeHeight / 2,
            Constants.PIPE_WIDTH,
            bottomPipeHeight,
            { isStatic: true, label: 'Pipe' }
        );

        Matter.World.add(engine.world, [topBody, bottomBody]);

        entities[`PipeTop${pipeCounter}`] = {
            body: topBody,
            size: [Constants.PIPE_WIDTH, topPipeHeight],
            renderer: PipeRenderer,
            scored: false
        };
        entities[`PipeBottom${pipeCounter}`] = {
            body: bottomBody,
            size: [Constants.PIPE_WIDTH, bottomPipeHeight],
            renderer: PipeRenderer
        };
    }

    // Move Pipes & Cleanup
    Object.keys(entities).forEach(key => {
        if (key.startsWith('Pipe')) {
            const entity = entities[key];
            // Scale movement by delta time (reference 60fps = 16.66ms)
            // If delta is 16ms, we move 'speed' pixels.
            const moveSpeed = Constants.PHYSICS.speed * (time.delta / 16.66);
            Matter.Body.translate(entity.body, { x: -moveSpeed, y: 0 });

            // Score Check (only on top pipe to avoid double count)
            if (key.startsWith('PipeTop') && !entity.scored) {
                if (entity.body.position.x < entities.Bird.body.position.x) {
                    entity.scored = true;
                    dispatch({ type: 'score' });
                }
            }

            // Cleanup
            if (entity.body.position.x < -Constants.PIPE_WIDTH) {
                Matter.World.remove(engine.world, entity.body);
                delete entities[key];
            }
        }
    });

    // Collision Detection
    // Check Engine Flag set in Screen.js
    if (engine.dispatchGameOver) {
        dispatch({ type: 'game_over' });
        engine.dispatchGameOver = false; // Reset
    }

    // Bird vs Floor/Ceiling
    if (entities.Bird.body.position.y > height - 25 || entities.Bird.body.position.y < 0) {
        dispatch({ type: 'game_over' });
    }

    return entities;
};

export default Physics;
