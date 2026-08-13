import { Member } from './types';
import { getSeatPositionConfig, LAYOUT_CONFIG } from './layoutConfig';

export function formatSeatmapData(members: Member[]) {
  const seats = members.map(member => {
    const pos = getSeatPositionConfig(member.seat);
    
    // Convert grid coordinates to pixel coordinates for the canvas
    // Using LAYOUT_CONFIG.CELL as the multiplier for spacing
    const x = (pos.x - 1) * LAYOUT_CONFIG.CELL;
    const y = (pos.y - 1) * LAYOUT_CONFIG.CELL;
    
    // Choose color based on vacancy
    let color = '#fef08a'; // yellow-200, occupied
    if (member.vacant) {
      color = '#bbf7d0'; // green-200, vacant
    }

    return {
      id: member.seat.toString(),
      title: member.seat.toString(),
      x: x,
      y: y,
      salable: member.vacant,
      color: color,
      custom_data: {
        member: member,
        face: pos.face
      }
    };
  });

  return {
    blocks: [{
      id: "main-floor",
      title: "Main Floor",
      color: "transparent",
      labels: [],
      seats: seats
    }]
  };
}
