import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const PipeRenderer = (props) => {
    const { body, size, isTop } = props; // isTop is passed in extra props? No, GameEngine entities
    const width = size[0];
    const height = size[1];
    const x = body.position.x - width / 2;
    const y = body.position.y - height / 2;

    return (
        <View
            style={{
                position: 'absolute',
                left: x,
                top: y,
                width: width,
                height: height,
                overflow: 'hidden',
                zIndex: 50,
            }}
        >
            <LinearGradient
                colors={['#22c55e', '#15803d']} // Green pipe
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                    flex: 1,
                    borderWidth: 3,
                    borderColor: '#064e3b',
                    borderRadius: 4
                }}
            >
                {/* Highlight */}
                <View style={{ position: 'absolute', left: 4, top: 0, bottom: 0, width: 4, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                <View style={{ position: 'absolute', right: 8, top: 0, bottom: 0, width: 2, backgroundColor: 'rgba(0,0,0,0.1)' }} />
            </LinearGradient>

            {/* Cap */}
            <View style={{
                position: 'absolute',
                top: 0, left: -4, right: -4, height: 20,
                backgroundColor: '#22c55e',
                borderWidth: 3, borderColor: '#064e3b',
                zIndex: 10
            }} />
        </View>
    );
};

export default PipeRenderer;
