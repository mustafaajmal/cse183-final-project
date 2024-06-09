function calculateConvexHull(points) {
    // Clone the points array to avoid modifying the original array
    const clonedPoints = points.slice();
    
    // Sort points by x-coordinate (in case of tie, sort by y-coordinate)
    clonedPoints.sort((a, b) => {
        if (a.lat === b.lat) {
            return a.lng - b.lng;
        }
        return a.lat - b.lat;
    });

    // Define helper functions for cross product and cross product sign
    function crossProduct(p1, p2, p3) {
        return (p2.lat - p1.lat) * (p3.lng - p1.lng) - (p3.lat - p1.lat) * (p2.lng - p1.lng);
    }

    function crossProductSign(p1, p2, p3) {
        const value = crossProduct(p1, p2, p3);
        return value === 0 ? 0 : (value > 0 ? 1 : -1);
    }

    // Initialize lower and upper hull arrays
    const lowerHull = [];
    const upperHull = [];

    // Build lower hull
    for (const point of clonedPoints) {
        while (lowerHull.length >= 2 && crossProductSign(lowerHull[lowerHull.length - 2], lowerHull[lowerHull.length - 1], point) <= 0) {
            lowerHull.pop();
        }
        lowerHull.push(point);
    }

    // Build upper hull
    for (let i = clonedPoints.length - 1; i >= 0; i--) {
        const point = clonedPoints[i];
        while (upperHull.length >= 2 && crossProductSign(upperHull[upperHull.length - 2], upperHull[upperHull.length - 1], point) <= 0) {
            upperHull.pop();
        }
        upperHull.push(point);
    }

    // Remove duplicates and combine lower and upper hulls
    upperHull.pop();
    lowerHull.pop();
    return lowerHull.concat(upperHull);
}