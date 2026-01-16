export type LayoutAnnotationType =
  | 'DOOR'
  | 'PILLAR'
  | 'WALL'
  | 'LABEL'
  | 'AREA';

export interface AislePosition {
  aisleNumber: number;
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270
  customWidth?: number;
}

export interface LayoutAnnotation {
  id: string;
  type: LayoutAnnotationType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  label?: string;
  color?: string;
}

export interface ZoneLayoutProps {
  aislePositions: AislePosition[];
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  annotations?: LayoutAnnotation[];
}

export class ZoneLayout {
  private readonly props: ZoneLayoutProps;

  private constructor(props: ZoneLayoutProps) {
    this.props = props;
  }

  get aislePositions(): AislePosition[] {
    return [...this.props.aislePositions];
  }

  get canvasWidth(): number {
    return this.props.canvasWidth;
  }

  get canvasHeight(): number {
    return this.props.canvasHeight;
  }

  get gridSize(): number {
    return this.props.gridSize;
  }

  get annotations(): LayoutAnnotation[] {
    return [...(this.props.annotations ?? [])];
  }

  get hasAnnotations(): boolean {
    return (
      this.props.annotations !== undefined && this.props.annotations.length > 0
    );
  }

  get aisleCount(): number {
    return this.props.aislePositions.length;
  }

  getAislePosition(aisleNumber: number): AislePosition | undefined {
    return this.props.aislePositions.find((p) => p.aisleNumber === aisleNumber);
  }

  getAnnotationsByType(type: LayoutAnnotationType): LayoutAnnotation[] {
    return this.annotations.filter((a) => a.type === type);
  }

  withUpdatedAislePosition(
    aisleNumber: number,
    position: Partial<AislePosition>,
  ): ZoneLayout {
    const updatedPositions = this.props.aislePositions.map((p) =>
      p.aisleNumber === aisleNumber ? { ...p, ...position } : p,
    );

    return new ZoneLayout({
      ...this.props,
      aislePositions: updatedPositions,
    });
  }

  withAddedAnnotation(annotation: LayoutAnnotation): ZoneLayout {
    return new ZoneLayout({
      ...this.props,
      annotations: [...(this.props.annotations ?? []), annotation],
    });
  }

  withRemovedAnnotation(annotationId: string): ZoneLayout {
    return new ZoneLayout({
      ...this.props,
      annotations: (this.props.annotations ?? []).filter(
        (a) => a.id !== annotationId,
      ),
    });
  }

  withCanvasSize(width: number, height: number): ZoneLayout {
    return new ZoneLayout({
      ...this.props,
      canvasWidth: width,
      canvasHeight: height,
    });
  }

  toJSON(): ZoneLayoutProps {
    return { ...this.props };
  }

  static create(props: Partial<ZoneLayoutProps> = {}): ZoneLayout {
    return new ZoneLayout({
      aislePositions: props.aislePositions ?? [],
      canvasWidth: props.canvasWidth ?? 1000,
      canvasHeight: props.canvasHeight ?? 800,
      gridSize: props.gridSize ?? 10,
      annotations: props.annotations ?? [],
    });
  }

  static fromJSON(json: ZoneLayoutProps): ZoneLayout {
    return new ZoneLayout(json);
  }

  static generateAutoLayout(
    aisleCount: number,
    canvasWidth = 1000,
    canvasHeight = 800,
  ): ZoneLayout {
    const spacing = canvasWidth / (aisleCount + 1);
    const aislePositions: AislePosition[] = [];

    for (let i = 1; i <= aisleCount; i++) {
      aislePositions.push({
        aisleNumber: i,
        x: spacing * i,
        y: canvasHeight / 2,
        rotation: 0,
      });
    }

    return ZoneLayout.create({
      aislePositions,
      canvasWidth,
      canvasHeight,
      gridSize: 10,
    });
  }
}
