;; One Gauss-Seidel pass over the strip's distance constraints. The JS solver
;; uses the same link order, double-precision arithmetic and float32 stores.
(module
  (memory (export "memory") 32)
  (func (export "solve") (param $link i32) (param $end i32)
    (local $a i32) (local $b i32)
    (local $x f64) (local $y f64) (local $z f64)
    (local $length f64) (local $error f64) (local $wa f64) (local $wb f64)
    (loop $next
      (local.set $a (i32.load (local.get $link)))
      (local.set $b (i32.load offset=4 (local.get $link)))
      (local.set $x (f64.sub (f64.promote_f32 (f32.load offset=0 (local.get $b))) (f64.promote_f32 (f32.load offset=0 (local.get $a)))))
      (local.set $y (f64.sub (f64.promote_f32 (f32.load offset=4 (local.get $b))) (f64.promote_f32 (f32.load offset=4 (local.get $a)))))
      (local.set $z (f64.sub (f64.promote_f32 (f32.load offset=8 (local.get $b))) (f64.promote_f32 (f32.load offset=8 (local.get $a)))))
      (local.set $length (f64.sqrt (f64.add (f64.add
        (f64.mul (local.get $x) (local.get $x))
        (f64.mul (local.get $y) (local.get $y)))
        (f64.mul (local.get $z) (local.get $z)))))
      (if (f64.ge (local.get $length) (f64.const 0.0001))
        (then
          (local.set $error (f64.sub (f64.const 1) (f64.div
            (f64.promote_f32 (f32.load offset=8 (local.get $link))) (local.get $length))))
          (local.set $wa (f64.mul (local.get $error) (f64.promote_f32 (f32.load offset=12 (local.get $link)))))
          (local.set $wb (f64.mul (local.get $error) (f64.promote_f32 (f32.load offset=16 (local.get $link)))))
          (f32.store offset=0 (local.get $a) (f32.demote_f64 (f64.add (f64.promote_f32 (f32.load offset=0 (local.get $a))) (f64.mul (local.get $x) (local.get $wa)))))
          (f32.store offset=0 (local.get $b) (f32.demote_f64 (f64.sub (f64.promote_f32 (f32.load offset=0 (local.get $b))) (f64.mul (local.get $x) (local.get $wb)))))
          (f32.store offset=4 (local.get $a) (f32.demote_f64 (f64.add (f64.promote_f32 (f32.load offset=4 (local.get $a))) (f64.mul (local.get $y) (local.get $wa)))))
          (f32.store offset=4 (local.get $b) (f32.demote_f64 (f64.sub (f64.promote_f32 (f32.load offset=4 (local.get $b))) (f64.mul (local.get $y) (local.get $wb)))))
          (f32.store offset=8 (local.get $a) (f32.demote_f64 (f64.add (f64.promote_f32 (f32.load offset=8 (local.get $a))) (f64.mul (local.get $z) (local.get $wa)))))
          (f32.store offset=8 (local.get $b) (f32.demote_f64 (f64.sub (f64.promote_f32 (f32.load offset=8 (local.get $b))) (f64.mul (local.get $z) (local.get $wb)))))))
      (local.set $link (i32.add (local.get $link) (i32.const 20)))
      (br_if $next (i32.lt_u (local.get $link) (local.get $end))))))
