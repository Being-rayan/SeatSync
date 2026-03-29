function serializeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: Number(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.created_at
  };
}

function serializeJourneyContext(row) {
  if (!row) {
    return null;
  }

  return {
    passengerJourneyId: Number(row.passenger_journey_id),
    pnrOrTicketRef: row.pnr_or_ticket_ref,
    passengerName: row.passenger_name,
    boardingPoint: row.boarding_point,
    destinationPoint: row.drop_point,
    verified: row.verified,
    verifiedAt: row.verified_at,
    assignedSeat: row.assigned_seat_id
      ? {
          id: Number(row.assigned_seat_id),
          number: row.assigned_seat_number
        }
      : null,
    originalSeat: row.original_assigned_seat_id
      ? {
          id: Number(row.original_assigned_seat_id),
          number: row.original_seat_number
        }
      : null,
    journey: {
      id: Number(row.journey_id),
      type: row.journey_type,
      code: row.journey_code,
      date: row.journey_date,
      coachOrBusNumber: row.coach_or_bus_number,
      origin: row.origin,
      destination: row.destination
    }
  };
}

function serializeNotification(row) {
  return {
    id: Number(row.id),
    type: row.type,
    title: row.title,
    body: row.body,
    isRead: row.is_read,
    meta: row.meta_json || {},
    createdAt: row.created_at
  };
}

function serializeSwap(row, actorUserId) {
  const acceptedStage = row.status === "accepted";
  const waitingOn = [];

  if (acceptedStage && !row.requester_final_confirmed) {
    waitingOn.push("requester");
  }

  if (acceptedStage && !row.receiver_final_confirmed) {
    waitingOn.push("receiver");
  }

  return {
    id: Number(row.id),
    status: row.status,
    stage: acceptedStage ? "final_confirmation" : row.status,
    message: row.message,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    requesterFinalConfirmed: row.requester_final_confirmed,
    receiverFinalConfirmed: row.receiver_final_confirmed,
    waitingOn,
    canAccept: actorUserId === Number(row.receiver_user_id) && row.status === "pending",
    canReject: actorUserId === Number(row.receiver_user_id) && row.status === "pending",
    canCancel: actorUserId === Number(row.requester_user_id) && row.status === "pending",
    canFinalConfirm:
      row.status === "accepted" &&
      ((actorUserId === Number(row.requester_user_id) && !row.requester_final_confirmed) ||
        (actorUserId === Number(row.receiver_user_id) && !row.receiver_final_confirmed)),
    journey: {
      id: Number(row.journey_id),
      type: row.journey_type,
      code: row.journey_code,
      date: row.journey_date,
      coachOrBusNumber: row.coach_or_bus_number,
      origin: row.origin,
      destination: row.destination
    },
    requester: {
      passengerJourneyId: Number(row.from_passenger_journey_id),
      userId: row.requester_user_id ? Number(row.requester_user_id) : null,
      name: row.requester_name,
      seat: {
        id: Number(row.from_seat_id),
        number: row.from_seat_number
      }
    },
    receiver: {
      passengerJourneyId: Number(row.to_passenger_journey_id),
      userId: row.receiver_user_id ? Number(row.receiver_user_id) : null,
      name: row.receiver_name,
      seat: {
        id: Number(row.to_seat_id),
        number: row.to_seat_number
      }
    }
  };
}

module.exports = {
  serializeJourneyContext,
  serializeNotification,
  serializeSwap,
  serializeUser
};
