import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Bird = ({ body, layout }) => {
    const { position } = body;
    const { width, height } = layout;

    return (
        <View
            style={{
                position: 'absolute',
                left: position.x - width / 2,
                top: position.y - height / 2,
                width: width,
                height: height,
                borderRadius: width / 2,
                overflow: 'hidden',
                borderWidth: 2,
                borderColor: '#000',
            }}
        >
            <LinearGradient
                colors={['#FCD34D', '#F59E0B']} // Yellow bird
                style={{ flex: 1 }}
            />
            {/* Eye */}
            <View style={{
                position: 'absolute',
                top: 5,
                right: 10,
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: '#fff',
                borderWidth: 2,
                borderColor: '#000'
            }}>
                <View style={{ width: 4, height: 4, backgroundColor: '#000', borderRadius: 2, position: 'absolute', right: 2, top: 4 }} />
            </View>
            {/* Beak */}
            <View style={{
                position: 'absolute',
                top: 20,
                right: -5,
                width: 16,
                height: 10,
                backgroundColor: '#EF4444',
                borderWidth: 1,
                borderColor: '#000',
                borderBottomLeftRadius: 5
            }} />
            {/* Wing */}
            <View style={{
                position: 'absolute',
                top: 20,
                left: 10,
                width: 20,
                height: 12,
                backgroundColor: '#FFF',
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#000',
                opacity: 0.8
            }} />
        </View>
    );
};



// Default export component for GameEngine
// Actually GameEngine expects a renderer component that receives props
export const BirdRenderer = (props) => {
    const { body, size } = props;
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
                zIndex: 100, // On top
            }}
        >
            <LinearGradient
                colors={['#FCD34D', '#F59E0B']}
                style={{
                    flex: 1,
                    borderRadius: width / 2,
                    borderWidth: 2,
                    borderColor: '#451a03'
                }}
            />
            {/* Eye */}
            <View style={{
                position: 'absolute', right: 8, top: 6,
                width: 14, height: 14, backgroundColor: 'white', borderRadius: 7,
                borderWidth: 2, borderColor: 'black', alignItems: 'center', justifyContent: 'center'
            }}>
                <View style={{ width: 4, height: 4, backgroundColor: 'black', borderRadius: 2, marginLeft: 4 }} />
            </View>
            {/* Wing */}
            <View style={{
                position: 'absolute', left: 4, top: 22,
                width: 20, height: 10, backgroundColor: 'white', borderRadius: 10,
                borderWidth: 2, borderColor: '#451a03'
            }} />
            {/* Beak */}
            <View style={{
                position: 'absolute', right: -6, top: 18,
                width: 14, height: 10, backgroundColor: '#f97316',
                borderBottomRightRadius: 5, borderWidth: 2, borderColor: 'black'
            }} />
        </View>
    );
}

export default BirdRenderer;
