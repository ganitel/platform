/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { reducer, toast } from './use-toast';

describe('use-toast reducer', () => {
  it('ADD_TOAST should prepend toast and enforce TOAST_LIMIT', () => {
    const initialState = {
      toasts: [
        { id: 'existing', title: 'Old', open: true },
      ],
    } as any;

    const nextState = reducer(initialState, {
      type: 'ADD_TOAST',
      toast: { id: 'new', title: 'New', open: true },
    } as any);

    expect(nextState.toasts).toEqual([{ id: 'new', title: 'New', open: true }]);
  });

  it('UPDATE_TOAST should merge toast by id', () => {
    const initialState = {
      toasts: [
        { id: '1', title: 'Before', open: true },
      ],
    } as any;

    const nextState = reducer(initialState, {
      type: 'UPDATE_TOAST',
      toast: { id: '1', title: 'After', description: 'Updated' },
    } as any);

    expect(nextState.toasts[0]).toMatchObject({
      id: '1',
      title: 'After',
      description: 'Updated',
      open: true,
    });
  });

  it('DISMISS_TOAST should close a specific toast', () => {
    const initialState = {
      toasts: [
        { id: '1', title: 'One', open: true },
        { id: '2', title: 'Two', open: true },
      ],
    } as any;

    const nextState = reducer(initialState, {
      type: 'DISMISS_TOAST',
      toastId: '2',
    } as any);

    expect(nextState.toasts.find((t: any) => t.id === '1')?.open).toBe(true);
    expect(nextState.toasts.find((t: any) => t.id === '2')?.open).toBe(false);
  });

  it('DISMISS_TOAST without id should close all toasts', () => {
    const initialState = {
      toasts: [
        { id: '1', title: 'One', open: true },
        { id: '2', title: 'Two', open: true },
      ],
    } as any;

    const nextState = reducer(initialState, {
      type: 'DISMISS_TOAST',
    } as any);

    expect(nextState.toasts.every((t: any) => t.open === false)).toBe(true);
  });

  it('REMOVE_TOAST should remove one toast by id', () => {
    const initialState = {
      toasts: [
        { id: '1', title: 'One', open: false },
        { id: '2', title: 'Two', open: false },
      ],
    } as any;

    const nextState = reducer(initialState, {
      type: 'REMOVE_TOAST',
      toastId: '1',
    } as any);

    expect(nextState.toasts).toEqual([{ id: '2', title: 'Two', open: false }]);
  });

  it('REMOVE_TOAST without id should clear all toasts', () => {
    const initialState = {
      toasts: [
        { id: '1', title: 'One', open: false },
      ],
    } as any;

    const nextState = reducer(initialState, {
      type: 'REMOVE_TOAST',
    } as any);

    expect(nextState.toasts).toEqual([]);
  });
});

describe('toast API', () => {
  it('returns id/update/dismiss handlers', () => {
    const created = toast({ title: 'Hello' } as any);

    expect(typeof created.id).toBe('string');
    expect(typeof created.update).toBe('function');
    expect(typeof created.dismiss).toBe('function');
  });

  it('generates unique ids for successive toasts', () => {
    const first = toast({ title: 'First' } as any);
    const second = toast({ title: 'Second' } as any);

    expect(first.id).not.toEqual(second.id);
  });
});
