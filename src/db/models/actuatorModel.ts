'use server';

import { prisma } from '@/lib/prisma';
import { CreateActuatorInput, UpdateActuatorInput } from '@/types/sensor';

export async function createActuator(data: CreateActuatorInput) {
  return prisma.actuator.create({
    data: {
      role: data.role,
      currentState: data.currentState ?? 'OFF',
    },
  });
}

export async function getActuators() {
  return prisma.actuator.findMany({
    include: {
      controlledBy: {
        include: {
          sensor: true,
        },
      },
      toggledBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: { id: 'asc' },
  });
}

export async function getActuatorById(id: number) {
  return prisma.actuator.findUnique({
    where: { id },
    include: {
      controlledBy: {
        include: {
          sensor: true,
        },
      },
      toggledBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function updateActuator(id: number, data: UpdateActuatorInput) {
  return prisma.actuator.update({
    where: { id },
    data,
  });
}

export async function deleteActuator(id: number) {
  return prisma.actuator.delete({
    where: { id },
  });
}

export async function toggleActuator(id: number, userId: number, nextState?: string) {
  const actuator = await prisma.actuator.findUnique({ where: { id } });
  if (!actuator) return null;

  const targetState = nextState ?? (actuator.currentState === 'ON' ? 'OFF' : 'ON');

  return prisma.actuator.update({
    where: { id },
    data: {
      currentState: targetState,
      toggledById: userId,
    },
    include: {
      toggledBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}
export async function updateActuatorByRole(role: string, state: string, userId?: number) {
  const actuator = await prisma.actuator.findFirst({
    where: { role },
  });

  if (!actuator) {
    // Create it if it doesn't exist
    return prisma.actuator.create({
      data: {
        role,
        currentState: state,
        toggledById: userId,
      },
    });
  }

  return prisma.actuator.update({
    where: { id: actuator.id },
    data: {
      currentState: state,
      toggledById: userId,
    },
  });
}
