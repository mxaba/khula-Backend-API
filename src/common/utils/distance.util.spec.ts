import { DistanceUtil } from './distance.util';

describe('DistanceUtil', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // Johannesburg to Pretoria (approximately 53-55 km)
      const distance = DistanceUtil.calculateDistance(
        -26.2041, 28.0473, // Johannesburg
        -25.7479, 28.2293, // Pretoria
      );

      expect(distance).toBeGreaterThan(53);
      expect(distance).toBeLessThan(55);
    });

    it('should return 0 for same coordinates', () => {
      const distance = DistanceUtil.calculateDistance(
        -26.2041, 28.0473,
        -26.2041, 28.0473,
      );

      expect(distance).toBe(0);
    });

    it('should calculate short distances accurately', () => {
      // Very close points (should be less than 1 km)
      const distance = DistanceUtil.calculateDistance(
        -26.2041, 28.0473,
        -26.2050, 28.0480,
      );

      expect(distance).toBeLessThan(1);
      expect(distance).toBeGreaterThan(0);
    });

    it('should calculate long distances correctly', () => {
      // Johannesburg to Durban (approximately 500-510 km)
      const distance = DistanceUtil.calculateDistance(
        -26.2041, 28.0473, // Johannesburg
        -29.8587, 31.0218, // Durban
      );

      expect(distance).toBeGreaterThan(499);
      expect(distance).toBeLessThan(510);
    });

    it('should handle negative and positive coordinates', () => {
      const distance = DistanceUtil.calculateDistance(
        51.5074, -0.1278,  // London
        40.7128, -74.0060, // New York
      );

      // Should be approximately 5570 km
      expect(distance).toBeGreaterThan(5500);
      expect(distance).toBeLessThan(5600);
    });

    it('should be symmetric (distance A to B equals B to A)', () => {
      const distance1 = DistanceUtil.calculateDistance(
        -26.2041, 28.0473,
        -25.7479, 28.2293,
      );

      const distance2 = DistanceUtil.calculateDistance(
        -25.7479, 28.2293,
        -26.2041, 28.0473,
      );

      expect(distance1).toBeCloseTo(distance2, 10);
    });
  });
});
